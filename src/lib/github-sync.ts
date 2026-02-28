import { Firestore, doc, serverTimestamp, setDoc } from "firebase/firestore";

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

const githubFetch = async <T>(endpoint: string, token: string): Promise<T> => {
  const url = `https://api.github.com${endpoint}`;
  console.log(`[github-sync] GET ${url}`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[github-sync] Request failed ${response.status} for ${endpoint}:`, body);
    throw new Error(`GitHub API ${response.status}: ${endpoint}`);
  }

  const data = (await response.json()) as T;
  console.log(`[github-sync] OK ${endpoint}`);
  return data;
};

const githubGraphqlFetch = async <T>(query: string, token: string): Promise<T> => {
  console.log("[github-sync] GraphQL: contributionCalendar query");
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[github-sync] GraphQL failed ${response.status}:`, body);
    throw new Error(`GitHub GraphQL ${response.status}`);
  }

  const data = (await response.json()) as T;
  console.log("[github-sync] GraphQL OK");
  return data;
};

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
    if (!counts.has(key)) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return normalizeBars(keys.map((key) => counts.get(key) ?? 0));
};

const toHeatmapLevel = (count: number, max: number) => {
  if (count <= 0) return 0;
  const ratio = count / Math.max(max, 1);
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
};

const buildHeatmapWeeks = (weeks: ContributionCalendarWeek[] | undefined): number[][] => {
  if (!weeks?.length) return [];
  const allCounts = weeks.flatMap((week) => week.contributionDays.map((day) => day.contributionCount));
  const max = Math.max(...allCounts, 1);
  return weeks.map((week) =>
    week.contributionDays.map((day) => toHeatmapLevel(day.contributionCount, max))
  );
};

const buildLanguageDistribution = (repos: GitHubRepo[]) => {
  const totals = new Map<string, number>();

  repos.forEach((repo) => {
    if (!repo.language) return;
    const next = (totals.get(repo.language) ?? 0) + Math.max(1, repo.size);
    totals.set(repo.language, next);
  });

  const sum = Array.from(totals.values()).reduce((acc, value) => acc + value, 0);
  if (!sum) return [];

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value: Math.round((value / sum) * 100) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

const buildStreak = (repos: GitHubRepo[]): number => {
  const days = new Set<string>();

  repos.forEach((repo) => {
    const pushed = new Date(repo.pushed_at);
    if (Number.isNaN(pushed.getTime())) return;
    days.add(pushed.toISOString().slice(0, 10));
  });

  if (!days.size) return 0;

  const sorted = Array.from(days)
    .map((value) => new Date(value))
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const diffDays = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000);
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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
        .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
        .map((entry) => entry.path as string)
        .slice(0, 80);

      if (files.length) return files;
    }

    const tree = await githubFetch<RepoContentItem[]>(
      `/repos/${repo.full_name}/contents?ref=${repo.default_branch}`,
      accessToken
    );

    return (Array.isArray(tree) ? tree : [])
      .filter((entry) => entry.type === "file" || entry.type === "dir")
      .map((entry) => entry.name)
      .slice(0, 20);
  } catch (err) {
    console.warn(`[github-sync] Failed to fetch files for ${repo.full_name}:`, err);
    return [];
  }
};

const fetchUserRepos = async (login: string, accessToken: string): Promise<GitHubRepo[]> => {
  const repos: GitHubRepo[] = [];
  const seen = new Set<string>();

  const loadPages = async (pathFactory: (page: number) => string) => {
    for (let page = 1; page <= 10; page += 1) {
      const batch = await githubFetch<GitHubRepo[]>(pathFactory(page), accessToken);
      if (!Array.isArray(batch) || !batch.length) break;

      batch.forEach((repo) => {
        if (!seen.has(repo.full_name)) {
          seen.add(repo.full_name);
          repos.push(repo);
        }
      });

      if (batch.length < 100) break;
    }
  };

  try {
    console.log(`[github-sync] Fetching all repos (private+public) for ${login}`);
    await loadPages(
      (page) =>
        `/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&per_page=100&page=${page}`
    );
    console.log(`[github-sync] Fetched ${repos.length} repos (including private)`);
  } catch (err) {
    console.warn(`[github-sync] Private repo fetch failed, falling back to public repos:`, err);
    // Fallback: fetch public repos if the authenticated endpoint fails
    try {
      await loadPages((page) => `/users/${encodeURIComponent(login)}/repos?sort=updated&per_page=100&page=${page}`);
      console.log(`[github-sync] Fallback: fetched ${repos.length} public repos`);
    } catch (err2) {
      console.error(`[github-sync] Public repo fallback also failed:`, err2);
    }
  }

  return repos;
};

// Safely fetch GitHub search count — returns 0 if rate-limited or any error
const safeSearchCount = async (query: string, token: string): Promise<number> => {
  try {
    const encoded = encodeURIComponent(query);
    const result = await githubFetch<SearchResult>(`/search/issues?q=${encoded}&per_page=1`, token);
    return result.total_count ?? 0;
  } catch (err) {
    console.warn(`[github-sync] Search failed for "${query}":`, err);
    return 0;
  }
};

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
  console.log("[github-sync] Starting full GitHub sync for uid:", uid);

  // Step 1: Fetch user profile
  const me = await githubFetch<GitHubUser>("/user", accessToken);
  console.log("[github-sync] GitHub user:", me.login);

  const contributionCalendarQuery = `
    query ViewerCalendar {
      viewer {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  // Step 2: Fetch stats in parallel — all failures are safely caught
  console.log("[github-sync] Fetching PRs, issues, reviews, and contribution calendar in parallel...");
  const [prsMergedCount, issuesClosedCount, codeReviewsCount, contributionCalendar] = await Promise.all([
    safeSearchCount(`author:${me.login} is:pr is:merged`, accessToken),
    safeSearchCount(`author:${me.login} is:issue is:closed`, accessToken),
    safeSearchCount(`reviewed-by:${me.login} is:pr`, accessToken),
    githubGraphqlFetch<ContributionCalendarResponse>(contributionCalendarQuery, accessToken).catch((err) => {
      console.warn("[github-sync] Contribution calendar GraphQL failed:", err);
      return {};
    }),
  ]);

  console.log(`[github-sync] PRs merged: ${prsMergedCount}, Issues closed: ${issuesClosedCount}, Code reviews: ${codeReviewsCount}`);

  // Step 3: Fetch repositories
  console.log("[github-sync] Fetching user repositories...");
  const repos = await fetchUserRepos(me.login, accessToken);
  console.log(`[github-sync] Total repos fetched: ${repos.length}`);

  const privateCount = repos.filter((repo) => repo.private).length;
  const publicCount = repos.length - privateCount;
  console.log(`[github-sync] Private: ${privateCount}, Public: ${publicCount}`);

  // Step 4: Build metrics
  const bars = buildMonthlyBars(repos);
  const heatmapWeeks = buildHeatmapWeeks(
    (contributionCalendar as ContributionCalendarResponse).data?.viewer?.contributionsCollection?.contributionCalendar?.weeks
  );
  console.log(`[github-sync] Heatmap weeks: ${heatmapWeeks.length}, Bars: ${bars.length}`);

  const languages = buildLanguageDistribution(repos);
  console.log(`[github-sync] Languages:`, languages.map((l) => `${l.name}(${l.value}%)`).join(", "));

  const primaryLanguage = languages[0]?.name ?? "TypeScript";

  const repoIntelligence = repos
    .map((repo) => {
      const recencyBoost = Math.max(0, 30 - Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / 86400000));
      const impact = clamp(
        repo.stargazers_count * 0.4 + repo.forks_count * 0.3 + Math.log10(Math.max(repo.size, 10)) * 2 + recencyBoost * 0.1,
        0,
        10
      );
      return { name: repo.full_name, impact: Number(impact.toFixed(1)) };
    })
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const reposBase = [...repos]
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 12);

  // Step 5: Fetch repo files (up to 8 repos)
  console.log(`[github-sync] Fetching file trees for top ${Math.min(reposBase.length, 8)} repos...`);
  const repoFilesList = await Promise.all(
    reposBase.map((repo, idx) => (idx < 8 ? getRepoFiles(repo, accessToken) : Promise.resolve([])))
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
  console.log(`[github-sync] Repos with files fetched: ${reposWithFiles}`);

  const contributionStrength = clamp(
    Math.round(
      repos.length * 1.2 +
      privateCount * 1.5 +
      prsMergedCount * 0.25 +
      issuesClosedCount * 0.15 +
      repoIntelligence.reduce((acc, repo) => acc + repo.impact, 0)
    ),
    15,
    99
  );

  const consistencyScore = clamp(
    Number((bars.reduce((acc, value) => acc + value, 0) / Math.max(bars.length, 1) / 10).toFixed(1)),
    1,
    10
  );

  console.log(`[github-sync] Contribution strength: ${contributionStrength}, Consistency: ${consistencyScore}`);

  // Step 6: Write everything to Firestore
  console.log("[github-sync] Writing data to Firestore...");
  await Promise.all([
    setDoc(
      doc(firestore, "users", uid, "profile", "main"),
      {
        name: me.name || fallbackName || me.login,
        headline: `${primaryLanguage} Engineer`,
        bio: me.bio || `Building with ${primaryLanguage} across private and public repositories.`,
        links: [
          { label: "GitHub", url: me.html_url },
          ...(me.blog ? [{ label: "Portfolio", url: me.blog }] : []),
        ],
      },
      { merge: true }
    ),
    setDoc(
      doc(firestore, "users", uid, "dashboard", "main"),
      {
        heading: `Welcome back, ${me.name || me.login}`,
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
        summary: `${me.name || me.login} has ${repos.length} repositories (${privateCount} private) in ${primaryLanguage} and more. Contribution strength: ${contributionStrength}/100. ${prsMergedCount} PRs merged, ${issuesClosedCount} issues closed.`,
        repoIntelligence,
        repos: reposGlimpse,
        contributionStreak: buildStreak(repos),
        openSourceImpact: [
          `${prsMergedCount} pull requests merged across repositories.`,
          `${privateCount} private repositories contributing to experience depth.`,
          `${me.followers} followers and ${me.following} following on GitHub.`,
          ...(codeReviewsCount > 0 ? [`${codeReviewsCount} pull requests reviewed — strong collaboration signal.`] : []),
        ],
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    ),
    setDoc(
      doc(firestore, "users", uid, "github", "main"),
      {
        login: me.login,
        email: me.email || fallbackEmail || "",
        avatarUrl: me.avatar_url,
        privateRepoCount: privateCount,
        publicRepoCount: publicCount,
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  console.log("[github-sync] ✅ All data written to Firestore successfully.");

  return {
    repoCount: repos.length,
    privateRepoCount: privateCount,
    publicRepoCount: publicCount,
    reposWithFiles,
  };
};
