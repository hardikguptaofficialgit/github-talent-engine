import { Firestore, doc, serverTimestamp, setDoc } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Fallback token from environment — used when the user's OAuth token fails
// ---------------------------------------------------------------------------
const ENV_GITHUB_TOKEN: string = import.meta.env.VITE_GITHUB_TOKEN ?? "";

type GitHubUser = {
  login: string;
  name: string | null;
  bio: string | null;
  email: string | null;
  blog: string | null;
  html_url: string;
  avatar_url: string;
  followers: number;
  following: number;
};

type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  pushed_at: string;
};

type RepoContentItem = {
  name: string;
  type: "file" | "dir" | "submodule";
};

type RepoBranchResponse = {
  commit?: {
    commit?: {
      tree?: {
        sha?: string;
      };
    };
  };
};

type RepoTreeResponse = {
  truncated?: boolean;
  tree?: Array<{
    path?: string;
    type?: "blob" | "tree" | "commit";
  }>;
};

type SearchResult = {
  total_count: number;
};

type ContributionCalendarDay = {
  contributionCount: number;
  date: string;
};

type ContributionCalendarWeek = {
  contributionDays: ContributionCalendarDay[];
};

type ContributionCalendarResponse = {
  data?: {
    viewer?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks?: ContributionCalendarWeek[];
        };
      };
    };
  };
};

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Fetch from GitHub REST API. If the provided token fails (401/403), retries
 * automatically with the env fallback token (VITE_GITHUB_TOKEN).
 */
const githubFetch = async <T>(endpoint: string, token: string): Promise<T> => {
  const url = `https://api.github.com${endpoint}`;

  const attempt = async (t: string): Promise<Response> => {
    return fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${t}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  };

  let response = await attempt(token);

  // If the user token is expired/revoked → retry with env fallback token
  if (!response.ok && (response.status === 401 || response.status === 403) && ENV_GITHUB_TOKEN && ENV_GITHUB_TOKEN !== token) {
    console.warn(`[github-sync] Token failed (${response.status}) for ${endpoint} — retrying with env fallback token`);
    response = await attempt(ENV_GITHUB_TOKEN);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[github-sync] ❌ ${response.status} ${endpoint}:`, body.slice(0, 200));
    throw new Error(`GitHub API ${response.status}: ${endpoint}`);
  }

  const data = (await response.json()) as T;
  console.log(`[github-sync] ✓ ${endpoint}`);
  return data;
};

/**
 * GraphQL helper — same auto-retry logic with env fallback.
 */
const githubGraphqlFetch = async <T>(query: string, token: string): Promise<T> => {
  const attempt = async (t: string): Promise<Response> => {
    return fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ query }),
    });
  };

  let response = await attempt(token);

  if (!response.ok && (response.status === 401 || response.status === 403) && ENV_GITHUB_TOKEN && ENV_GITHUB_TOKEN !== token) {
    console.warn(`[github-sync] GraphQL token failed (${response.status}) — retrying with env fallback token`);
    response = await attempt(ENV_GITHUB_TOKEN);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[github-sync] ❌ GraphQL ${response.status}:`, body.slice(0, 200));
    throw new Error(`GitHub GraphQL ${response.status}`);
  }

  const data = (await response.json()) as T;
  console.log(`[github-sync] ✓ GraphQL contributionCalendar`);
  return data;
};

// ---------------------------------------------------------------------------
// GitHub search with safe fallback
// ---------------------------------------------------------------------------

/**
 * Returns total_count for a GitHub search query.
 * Never throws — returns 0 on any failure.
 */
const safeSearchCount = async (query: string, token: string): Promise<number> => {
  try {
    const encoded = encodeURIComponent(query);
    const result = await githubFetch<SearchResult>(`/search/issues?q=${encoded}&per_page=1`, token);
    return result.total_count ?? 0;
  } catch (err) {
    console.warn(`[github-sync] ⚠️ Search skipped for "${query}":`, err instanceof Error ? err.message : err);
    return 0;
  }
};

// ---------------------------------------------------------------------------
// Metric builders
// ---------------------------------------------------------------------------

const normalizeBars = (counts: number[]): number[] => {
  const max = Math.max(...counts, 1);
  return counts.map((count) => (count === 0 ? 8 : Math.round((count / max) * 100)));
};

const buildMonthlyBars = (repos: GitHubRepo[]): number[] => {
  const now = new Date();
  const keys = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const counts = new Map<string, number>(keys.map((key) => [key, 0]));
  repos.forEach((repo) => {
    const pushed = new Date(repo.pushed_at);
    if (Number.isNaN(pushed.getTime())) return;
    const key = `${pushed.getFullYear()}-${String(pushed.getMonth() + 1).padStart(2, "0")}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return normalizeBars(keys.map((key) => counts.get(key) ?? 0));
};

const toHeatmapLevel = (count: number, max: number): number => {
  if (count <= 0) return 0;
  const ratio = count / Math.max(max, 1);
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
};

const buildHeatmapWeeks = (weeks: ContributionCalendarWeek[] | undefined): number[][] => {
  if (!weeks?.length) return [];
  const allCounts = weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount));
  const max = Math.max(...allCounts, 1);
  return weeks.map((w) => w.contributionDays.map((d) => toHeatmapLevel(d.contributionCount, max)));
};

const buildLanguageDistribution = (repos: GitHubRepo[]) => {
  const totals = new Map<string, number>();
  repos.forEach((repo) => {
    if (!repo.language) return;
    totals.set(repo.language, (totals.get(repo.language) ?? 0) + Math.max(1, repo.size));
  });
  const sum = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  if (!sum) return [];
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value: Math.round((value / sum) * 100) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
};

const buildStreak = (repos: GitHubRepo[]): number => {
  const days = new Set<string>();
  repos.forEach((repo) => {
    const pushed = new Date(repo.pushed_at);
    if (!Number.isNaN(pushed.getTime())) days.add(pushed.toISOString().slice(0, 10));
  });
  if (!days.size) return 0;

  const sorted = Array.from(days)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000);
    current = diff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ---------------------------------------------------------------------------
// Repo file tree fetching
// ---------------------------------------------------------------------------

const getRepoFiles = async (repo: GitHubRepo, accessToken: string): Promise<string[]> => {
  try {
    const branch = await githubFetch<RepoBranchResponse>(
      `/repos/${repo.full_name}/branches/${repo.default_branch}`,
      accessToken
    );
    const treeSha = branch.commit?.commit?.tree?.sha;

    if (treeSha) {
      const tree = await githubFetch<RepoTreeResponse>(
        `/repos/${repo.full_name}/git/trees/${treeSha}?recursive=1`,
        accessToken
      );
      const files = (tree.tree ?? [])
        .filter((e) => e.type === "blob" && typeof e.path === "string")
        .map((e) => e.path as string)
        .slice(0, 80);
      if (files.length) return files;
    }

    // Shallow fallback
    const contents = await githubFetch<RepoContentItem[]>(
      `/repos/${repo.full_name}/contents?ref=${repo.default_branch}`,
      accessToken
    );
    return (Array.isArray(contents) ? contents : [])
      .filter((e) => e.type === "file" || e.type === "dir")
      .map((e) => e.name)
      .slice(0, 20);
  } catch (err) {
    console.warn(`[github-sync] ⚠️ File tree skipped for ${repo.full_name}:`, err instanceof Error ? err.message : err);
    return [];
  }
};

// ---------------------------------------------------------------------------
// Repo listing — tries authenticated endpoint first, falls back to public
// ---------------------------------------------------------------------------

const fetchUserRepos = async (login: string, accessToken: string): Promise<GitHubRepo[]> => {
  const repos: GitHubRepo[] = [];
  const seen = new Set<string>();

  const loadPages = async (pathFactory: (page: number) => string, tokenOverride?: string) => {
    for (let page = 1; page <= 10; page++) {
      const batch = await githubFetch<GitHubRepo[]>(pathFactory(page), tokenOverride ?? accessToken);
      if (!Array.isArray(batch) || !batch.length) break;
      batch.forEach((r) => {
        if (!seen.has(r.full_name)) { seen.add(r.full_name); repos.push(r); }
      });
      if (batch.length < 100) break;
    }
  };

  try {
    // Authenticated — sees private repos too
    console.log(`[github-sync] Fetching all repos (auth) for ${login}...`);
    await loadPages(
      (page) => `/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&per_page=100&page=${page}`
    );
    console.log(`[github-sync] ✓ ${repos.length} repos fetched (including private)`);
  } catch (err) {
    console.warn(`[github-sync] ⚠️ Authenticated repo fetch failed, trying public:`, err instanceof Error ? err.message : err);
    try {
      // Public repos — use env token if available for higher rate limits
      await loadPages(
        (page) => `/users/${encodeURIComponent(login)}/repos?sort=updated&per_page=100&page=${page}`,
        ENV_GITHUB_TOKEN || accessToken
      );
      console.log(`[github-sync] ✓ Fallback: ${repos.length} public repos fetched`);
    } catch (err2) {
      console.error(`[github-sync] ❌ Both repo fetches failed:`, err2 instanceof Error ? err2.message : err2);
    }
  }

  return repos;
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const syncGithubInsights = async ({
  firestore,
  uid,
  accessToken,
  fallbackName,
  fallbackEmail,
}: {
  firestore: Firestore;
  uid: string;
  accessToken: string;
  fallbackName?: string | null;
  fallbackEmail?: string | null;
}): Promise<{ repoCount: number; privateRepoCount: number; publicRepoCount: number; reposWithFiles: number }> => {

  // Use env token as last resort if no user token provided
  const effectiveToken = accessToken || ENV_GITHUB_TOKEN;
  if (!effectiveToken) throw new Error("No GitHub token available");

  console.log(`[github-sync] ▶ Starting full GitHub sync for uid: ${uid}`);
  console.log(`[github-sync] Token source: ${accessToken ? "user OAuth" : "env fallback"}`);

  // ── Step 1: User profile ─────────────────────────────────────────────────
  const me = await githubFetch<GitHubUser>("/user", effectiveToken);
  console.log(`[github-sync] GitHub user: ${me.login} (${me.name ?? "no name"})`);

  // ── Step 2: Parallel stats ───────────────────────────────────────────────
  const contributionCalendarQuery = `
    query ViewerCalendar {
      viewer {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays { contributionCount date }
            }
          }
        }
      }
    }
  `;

  console.log(`[github-sync] Fetching PRs, issues, reviews, and heatmap in parallel...`);
  const [prsMergedCount, issuesClosedCount, codeReviewsCount, contributionCalendar] = await Promise.all([
    safeSearchCount(`author:${me.login} is:pr is:merged`, effectiveToken),
    safeSearchCount(`author:${me.login} is:issue is:closed`, effectiveToken),
    safeSearchCount(`reviewed-by:${me.login} is:pr`, effectiveToken),
    githubGraphqlFetch<ContributionCalendarResponse>(contributionCalendarQuery, effectiveToken).catch((err) => {
      console.warn("[github-sync] ⚠️ Contribution calendar skipped:", err instanceof Error ? err.message : err);
      return {} as ContributionCalendarResponse;
    }),
  ]);
  console.log(`[github-sync] PRs merged: ${prsMergedCount} | Issues closed: ${issuesClosedCount} | Reviews: ${codeReviewsCount}`);

  // ── Step 3: Repositories ─────────────────────────────────────────────────
  const repos = await fetchUserRepos(me.login, effectiveToken);
  const privateCount = repos.filter((r) => r.private).length;
  const publicCount = repos.length - privateCount;
  console.log(`[github-sync] Repos: ${repos.length} total (${privateCount} private, ${publicCount} public)`);

  // ── Step 4: Build derived metrics ────────────────────────────────────────
  const bars = buildMonthlyBars(repos);
  const heatmapWeeks = buildHeatmapWeeks(
    (contributionCalendar as ContributionCalendarResponse).data?.viewer?.contributionsCollection?.contributionCalendar?.weeks
  );
  const languages = buildLanguageDistribution(repos);
  const primaryLanguage = languages[0]?.name ?? "TypeScript";
  console.log(`[github-sync] Heatmap weeks: ${heatmapWeeks.length} | Languages: ${languages.map((l) => `${l.name}(${l.value}%)`).join(", ")}`);

  const repoIntelligence = repos
    .map((repo) => {
      const recencyDays = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / 86400000);
      const recencyBoost = Math.max(0, 30 - recencyDays);
      const impact = clamp(
        repo.stargazers_count * 0.4 +
        repo.forks_count * 0.3 +
        Math.log10(Math.max(repo.size, 10)) * 2 +
        recencyBoost * 0.1,
        0, 10
      );
      return { name: repo.full_name, impact: Number(impact.toFixed(1)) };
    })
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  // ── Step 5: Repo file trees (top 8 repos by recency) ─────────────────────
  const reposBase = [...repos]
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 12);

  console.log(`[github-sync] Fetching file trees for top ${Math.min(reposBase.length, 8)} repos...`);
  const repoFilesList = await Promise.all(
    reposBase.map((repo, idx) => idx < 8 ? getRepoFiles(repo, effectiveToken) : Promise.resolve([]))
  );

  const reposGlimpse = reposBase.map((repo, idx) => ({
    name: repo.full_name,
    url: repo.html_url,
    isPrivate: repo.private,
    language: repo.language ?? "Unknown",
    stars: repo.stargazers_count,
    updatedAt: repo.pushed_at,
    files: repoFilesList[idx] ?? [],
  }));

  const reposWithFiles = reposGlimpse.filter((r) => r.files.length > 0).length;
  console.log(`[github-sync] Repos with file trees: ${reposWithFiles}`);

  // ── Step 6: Calculate scores ──────────────────────────────────────────────
  const contributionStrength = clamp(
    Math.round(
      repos.length * 1.2 +
      privateCount * 1.5 +
      prsMergedCount * 0.25 +
      issuesClosedCount * 0.15 +
      repoIntelligence.reduce((acc, r) => acc + r.impact, 0)
    ),
    15, 99
  );

  const consistencyScore = clamp(
    Number((bars.reduce((a, b) => a + b, 0) / Math.max(bars.length, 1) / 10).toFixed(1)),
    1, 10
  );

  const contributionStreak = buildStreak(repos);
  console.log(`[github-sync] Strength: ${contributionStrength}/100 | Consistency: ${consistencyScore}/10 | Streak: ${contributionStreak} days`);

  // ── Step 7: Write to Firestore ────────────────────────────────────────────
  console.log(`[github-sync] Writing to Firestore...`);

  const profileName = me.name || fallbackName || me.login;
  const profileBio = me.bio || `Building with ${primaryLanguage} across ${repos.length} repositories.`;

  await Promise.all([
    // /users/{uid}/profile/main
    setDoc(
      doc(firestore, "users", uid, "profile", "main"),
      {
        name: profileName,
        headline: `${primaryLanguage} Developer`,
        bio: profileBio,
        links: [
          { label: "GitHub", url: me.html_url },
          ...(me.blog ? [{ label: "Portfolio", url: me.blog }] : []),
        ],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ),

    // /users/{uid}/dashboard/main
    setDoc(
      doc(firestore, "users", uid, "dashboard", "main"),
      {
        heading: `Welcome back, ${profileName}`,
        subheading: `Insights from ${repos.length} repositories (${privateCount} private, ${publicCount} public).`,
        contributionStrength,
        consistencyScore,
        consistencyBars: bars,
        heatmapWeeks,
        collaboration: {
          prsMerged: prsMergedCount,
          codeReviews: codeReviewsCount,
          issuesClosed: issuesClosedCount,
        },
        languages,
        summary: `${profileName} maintains ${repos.length} repositories (${privateCount} private, ${publicCount} public) with a primary focus on ${primaryLanguage}. Contribution strength: ${contributionStrength}/100. ${prsMergedCount} PRs merged, ${issuesClosedCount} issues closed, ${codeReviewsCount} code reviews — strong engineering collaboration signal.`,
        repoIntelligence,
        repos: reposGlimpse,
        contributionStreak,
        openSourceImpact: [
          `${prsMergedCount} pull requests merged across repositories.`,
          `${privateCount} private repositories contributing to experience depth.`,
          `${me.followers} followers, ${me.following} following on GitHub.`,
          ...(codeReviewsCount > 0 ? [`${codeReviewsCount} pull requests reviewed — active code review culture.`] : []),
          ...(contributionStreak > 1 ? [`${contributionStreak}-day contribution streak on record.`] : []),
        ],
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    ),

    // /users/{uid}/github/main
    setDoc(
      doc(firestore, "users", uid, "github", "main"),
      {
        login: me.login,
        email: me.email || fallbackEmail || "",
        avatarUrl: me.avatar_url,
        privateRepoCount: privateCount,
        publicRepoCount: publicCount,
        totalRepos: repos.length,
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  console.log(`[github-sync] ✅ Firestore write complete. ${repos.length} repos, ${reposWithFiles} with file trees.`);

  return { repoCount: repos.length, privateRepoCount: privateCount, publicRepoCount: publicCount, reposWithFiles };
};
