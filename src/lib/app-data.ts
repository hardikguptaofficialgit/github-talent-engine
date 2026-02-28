import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "@/lib/firebase";

export type DashboardData = {
  heading: string;
  subheading: string;
  contributionStrength: number;
  consistencyScore: number;
  consistencyBars: number[];
  heatmapWeeks: number[][];
  collaboration: { prsMerged: number; codeReviews: number; issuesClosed: number };
  languages: { name: string; value: number }[];
  summary: string;
  repoIntelligence: { name: string; impact: number }[];
  repos: {
    name: string;
    url: string;
    isPrivate: boolean;
    language: string;
    stars: number;
    updatedAt: string;
    files: string[];
  }[];
  contributionStreak: number;
  openSourceImpact: string[];
};

export type JobItem = {
  id: string;
  company: string;
  role: string;
  location: string;
  posted: string;
  match: number;
  why: string;
  skillGap: string;
  tags: string[];
};

export type ApplicationStatus = "Saved" | "Applied" | "Interview" | "Offer";

export type ApplicationItem = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  company: string;
  role: string;
  location: string;
  match: number;
  tags: string[];
  foot: string;
  applicantName?: string;
  applicantEmail?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  note?: string;
};

export type ApplyPayload = {
  applicantName: string;
  applicantEmail: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  note?: string;
};

export type ProfileData = {
  name: string;
  headline: string;
  bio: string;
  links: { label: string; url: string }[];
};

const EMPTY_DASHBOARD: DashboardData = {
  heading: "Dashboard",
  subheading: "Track your coding performance, collaboration, and momentum.",
  contributionStrength: 0,
  consistencyScore: 0,
  consistencyBars: [],
  heatmapWeeks: [],
  collaboration: { prsMerged: 0, codeReviews: 0, issuesClosed: 0 },
  languages: [],
  summary: "",
  repoIntelligence: [],
  repos: [],
  contributionStreak: 0,
  openSourceImpact: [],
};

const FEATURED_JOBS: JobItem[] = [
  {
    id: "featured-vercel-platform-intern",
    company: "Vercel",
    role: "Software Engineer Intern, Platform",
    location: "San Francisco, CA (Remote)",
    posted: "Posted 2d ago",
    match: 91,
    why: "Your repository history maps strongly to frontend platform work and performance-focused delivery.",
    skillGap: "Advanced observability tooling would improve match confidence.",
    tags: ["TypeScript", "React", "Performance", "DX"],
  },
  {
    id: "featured-stripe-backend-intern",
    company: "Stripe",
    role: "Backend Engineering Intern",
    location: "Seattle, WA (Hybrid)",
    posted: "Posted 3d ago",
    match: 89,
    why: "Your backend projects show strong API design and practical production-minded engineering patterns.",
    skillGap: "Deeper payments domain experience can raise your fit score.",
    tags: ["Go", "API Design", "PostgreSQL", "Testing"],
  },
  {
    id: "featured-cloudflare-swe-intern",
    company: "Cloudflare",
    role: "Software Engineering Intern, Edge",
    location: "Austin, TX (Hybrid)",
    posted: "Posted 5d ago",
    match: 87,
    why: "Your systems and networking contributions align with edge runtime and reliability work.",
    skillGap: "Hands-on distributed tracing would strengthen readiness.",
    tags: ["Distributed Systems", "Networking", "Rust", "Reliability"],
  },
  {
    id: "featured-github-open-source-intern",
    company: "GitHub",
    role: "Open Source Programs Intern",
    location: "Remote",
    posted: "Posted 1w ago",
    match: 86,
    why: "Your pull request collaboration quality and contribution consistency align with open-source program goals.",
    skillGap: "Broader maintainer experience across multiple projects is recommended.",
    tags: ["Open Source", "Collaboration", "CI/CD", "Community"],
  },
];

const DEMO_UID = "demo-user";
const DEMO_PROFILE_KEY = "opensourcehire.demo.profile";
const DEMO_APPLICATIONS_KEY = "opensourcehire.demo.applications";

const DEMO_DASHBOARD: DashboardData = {
  heading: "Welcome back, Hardik",
  subheading: "Live demo data from a full-stack GitHub profile and role trends.",
  contributionStrength: 86,
  consistencyScore: 8.4,
  consistencyBars: [48, 62, 59, 73, 66, 77, 69, 88, 71, 82, 76, 91],
  heatmapWeeks: Array.from({ length: 52 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => ((week + day) % 5 === 0 ? 4 : ((week * day + 2) % 4) + 1))
  ),
  collaboration: { prsMerged: 41, codeReviews: 29, issuesClosed: 18 },
  languages: [
    { name: "TypeScript", value: 34 },
    { name: "Python", value: 22 },
    { name: "Go", value: 16 },
    { name: "Dockerfile", value: 14 },
    { name: "SQL", value: 14 },
  ],
  summary:
    "Hardik ships consistently across frontend and backend repositories, with strong collaboration and pragmatic delivery velocity.",
  repoIntelligence: [
    { name: "hardik-gupta/job-radar", impact: 9.4 },
    { name: "hardik-gupta/gh-analytics-engine", impact: 8.8 },
    { name: "hardik-gupta/interview-tracker-pro", impact: 8.2 },
  ],
  repos: [
    {
      name: "hardik-gupta/job-radar",
      url: "https://github.com/hardik-gupta/job-radar",
      isPrivate: false,
      language: "TypeScript",
      stars: 31,
      updatedAt: "2026-02-24T09:22:00Z",
      files: ["src/app/dashboard.tsx", "src/lib/trends.ts", "src/components/fit-score-card.tsx", "README.md", "package.json"],
    },
    {
      name: "hardik-gupta/gh-analytics-engine",
      url: "https://github.com/hardik-gupta/gh-analytics-engine",
      isPrivate: true,
      language: "Python",
      stars: 12,
      updatedAt: "2026-02-21T14:05:00Z",
      files: ["engine/collector.py", "engine/scoring.py", "engine/heatmap.py", "tests/test_scoring.py", "pyproject.toml"],
    },
    {
      name: "hardik-gupta/interview-tracker-pro",
      url: "https://github.com/hardik-gupta/interview-tracker-pro",
      isPrivate: false,
      language: "Go",
      stars: 22,
      updatedAt: "2026-02-17T11:41:00Z",
      files: ["cmd/server/main.go", "internal/applications/service.go", "internal/jobs/repository.go", "web/src/pages/board.tsx", "README.md"],
    },
  ],
  contributionStreak: 17,
  openSourceImpact: [
    "53 pull requests opened across active repositories in the last 12 months.",
    "Reviewed 29 pull requests with architecture and test-depth feedback.",
    "Maintains 3 production-style projects with clear documentation and CI pipelines.",
  ],
};

const DEMO_PROFILE: ProfileData = {
  name: "Hardik Gupta",
  headline: "Full-Stack Engineer | TypeScript, Python, Go",
  bio: "I build developer-focused products and workflow automation with strong UX, testing, and scalable backend design.",
  links: [
    { label: "GitHub", url: "https://github.com/hardik-gupta" },
    { label: "Portfolio", url: "https://hardik-gupta.dev" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/hardik-gupta-dev/" },
  ],
};

const DEMO_APPLICATIONS: ApplicationItem[] = [
  {
    id: "demo-app-1",
    jobId: "featured-vercel-platform-intern",
    status: "Interview",
    company: "Vercel",
    role: "Software Engineer Intern, Platform",
    location: "San Francisco, CA (Remote)",
    match: 94,
    tags: ["TypeScript", "React", "DX"],
    foot: "Interview stage",
    applicantName: "Hardik Gupta",
    applicantEmail: "hardik@konvergehack.in",
  },
  {
    id: "demo-app-2",
    jobId: "featured-stripe-backend-intern",
    status: "Applied",
    company: "Stripe",
    role: "Backend Engineering Intern",
    location: "Seattle, WA (Hybrid)",
    match: 90,
    tags: ["Go", "API Design", "PostgreSQL"],
    foot: "Application submitted",
    applicantName: "Hardik Gupta",
    applicantEmail: "hardik@konvergehack.in",
  },
  {
    id: "demo-app-3",
    jobId: "featured-cloudflare-swe-intern",
    status: "Saved",
    company: "Cloudflare",
    role: "Software Engineering Intern, Edge",
    location: "Austin, TX (Hybrid)",
    match: 88,
    tags: ["Rust", "Networking", "Reliability"],
    foot: "Saved for later",
    applicantName: "Hardik Gupta",
    applicantEmail: "hardik@konvergehack.in",
  },
];

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const asNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number");
};

const asNumberMatrix = (value: unknown): number[][] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.filter((item): item is number => typeof item === "number"));
};

type RepoPreview = DashboardData["repos"][number];
type GitHubPublicRepo = {
  full_name: string;
  html_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  default_branch: string;
};

type GitHubPublicContent = {
  path?: string;
  name?: string;
  type?: "file" | "dir" | "submodule";
};

const toStringIfPresent = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);

const toNumberIfPresent = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

const asFileList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      return toStringIfPresent(item.path) ?? toStringIfPresent(item.name);
    })
    .filter((entry): entry is string => typeof entry === "string");
};

const normalizeRepo = (value: unknown): RepoPreview | null => {
  if (!value || typeof value !== "object") return null;
  const repo = value as Record<string, unknown>;

  const name =
    toStringIfPresent(repo.name) ??
    toStringIfPresent(repo.full_name) ??
    toStringIfPresent(repo.fullName);
  const url =
    toStringIfPresent(repo.url) ??
    toStringIfPresent(repo.html_url) ??
    toStringIfPresent(repo.htmlUrl);
  const language =
    toStringIfPresent(repo.language) ??
    toStringIfPresent(repo.primaryLanguage) ??
    "Unknown";
  const updatedAt =
    toStringIfPresent(repo.updatedAt) ??
    toStringIfPresent(repo.pushed_at) ??
    toStringIfPresent(repo.updated_at) ??
    "";

  const stars =
    toNumberIfPresent(repo.stars) ??
    toNumberIfPresent(repo.stargazers_count) ??
    toNumberIfPresent(repo.starCount) ??
    0;

  const isPrivate =
    typeof repo.isPrivate === "boolean"
      ? repo.isPrivate
      : typeof repo.private === "boolean"
        ? repo.private
        : repo.visibility === "private";

  const fileCandidates = [repo.files, repo.fileTree, repo.tree, repo.paths].map(asFileList);
  const files = fileCandidates.find((list) => list.length > 0) ?? [];

  if (!name || !url) return null;

  return {
    name,
    url,
    isPrivate,
    language,
    stars,
    updatedAt,
    files,
  };
};

const fetchPublicRepoFiles = async (fullName: string, defaultBranch: string): Promise<string[]> => {
  try {
    const [owner, repo] = fullName.split("/");
    if (!owner || !repo) return [];
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents?ref=${encodeURIComponent(defaultBranch)}`
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) return [];
    return payload
      .filter((entry): entry is GitHubPublicContent => !!entry && typeof entry === "object")
      .filter((entry) => entry.type === "file" || entry.type === "dir")
      .map((entry) => toStringIfPresent(entry.path) ?? toStringIfPresent(entry.name))
      .filter((file): file is string => typeof file === "string")
      .slice(0, 20);
  } catch {
    return [];
  }
};

const fetchPublicRepoFallback = async (uid: string): Promise<RepoPreview[]> => {
  if (!db) return [];
  try {
    const githubSnap = await getDoc(doc(db, "users", uid, "github", "main"));
    const githubData = githubSnap.exists() ? (githubSnap.data() as Record<string, unknown>) : null;
    const login = githubData && typeof githubData.login === "string" ? githubData.login : "";
    if (!login) return [];

    const reposResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=updated&per_page=12`
    );
    if (!reposResponse.ok) return [];
    const reposPayload = (await reposResponse.json()) as unknown;
    if (!Array.isArray(reposPayload)) return [];

    const repos = reposPayload
      .filter((repo): repo is GitHubPublicRepo => !!repo && typeof repo === "object" && typeof (repo as GitHubPublicRepo).full_name === "string")
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
      .slice(0, 12);

    const filesByRepo = await Promise.all(
      repos.map((repo, index) => (index < 6 ? fetchPublicRepoFiles(repo.full_name, repo.default_branch || "main") : Promise.resolve([])))
    );

    return repos.map((repo, index) => ({
      name: repo.full_name,
      url: repo.html_url,
      isPrivate: !!repo.private,
      language: repo.language ?? "Unknown",
      stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
      updatedAt: repo.pushed_at ?? "",
      files: filesByRepo[index] ?? [],
    }));
  } catch {
    return [];
  }
};

const normalizeJob = (id: string, data: Partial<JobItem>): JobItem => {
  const match = typeof data.match === "number" ? data.match : 0;
  return {
    id,
    company: typeof data.company === "string" ? data.company : "Unknown Company",
    role: typeof data.role === "string" ? data.role : "Unknown Role",
    location: typeof data.location === "string" ? data.location : "Remote",
    posted: typeof data.posted === "string" ? data.posted : "Recently posted",
    match,
    why: typeof data.why === "string" ? data.why : "Strong alignment based on recent engineering activity.",
    skillGap: typeof data.skillGap === "string" ? data.skillGap : "Add more relevant project depth to improve fit.",
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : [],
  };
};

const buildFoot = (status: ApplicationStatus) => {
  if (status === "Saved") return "Saved for later";
  if (status === "Applied") return "Application submitted";
  if (status === "Interview") return "Interview stage";
  return "Offer stage";
};

const normalizeApplication = (id: string, data: Record<string, unknown>): ApplicationItem => {
  const status =
    data.status === "Saved" || data.status === "Applied" || data.status === "Interview" || data.status === "Offer"
      ? data.status
      : "Saved";

  return {
    id,
    jobId: typeof data.jobId === "string" ? data.jobId : id,
    status,
    company: typeof data.company === "string" ? data.company : "Unknown Company",
    role: typeof data.role === "string" ? data.role : "Unknown Role",
    location: typeof data.location === "string" ? data.location : "Remote",
    match: typeof data.match === "number" ? data.match : 0,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    foot: typeof data.foot === "string" ? data.foot : buildFoot(status),
    applicantName: typeof data.applicantName === "string" ? data.applicantName : undefined,
    applicantEmail: typeof data.applicantEmail === "string" ? data.applicantEmail : undefined,
    portfolioUrl: typeof data.portfolioUrl === "string" ? data.portfolioUrl : undefined,
    resumeUrl: typeof data.resumeUrl === "string" ? data.resumeUrl : undefined,
    note: typeof data.note === "string" ? data.note : undefined,
  };
};

export const getDashboardData = async (uid: string): Promise<DashboardData> => {
  if (uid === DEMO_UID) {
    return DEMO_DASHBOARD;
  }
  if (!hasFirebaseConfig || !db || !uid) return EMPTY_DASHBOARD;

  try {
    const snap = await getDoc(doc(db, "users", uid, "dashboard", "main"));
    if (!snap.exists()) {
      const repos = await fetchPublicRepoFallback(uid);
      if (!repos.length) return EMPTY_DASHBOARD;
      return {
        ...EMPTY_DASHBOARD,
        subheading: `Loaded ${repos.length} recent public repositories from GitHub.`,
        repos,
      };
    }

    const remote = snap.data() as Partial<DashboardData>;
    const normalizedRepos = (
      Array.isArray(remote.repos)
        ? remote.repos
        : Array.isArray((remote as Record<string, unknown>).repositories)
          ? (remote as Record<string, unknown>).repositories
          : []
    )
      .map(normalizeRepo)
      .filter((repo): repo is RepoPreview => !!repo);

    const repos = normalizedRepos.length ? normalizedRepos : await fetchPublicRepoFallback(uid);

    return {
      heading: remote.heading ?? EMPTY_DASHBOARD.heading,
      subheading: remote.subheading ?? EMPTY_DASHBOARD.subheading,
      contributionStrength: typeof remote.contributionStrength === "number" ? remote.contributionStrength : 0,
      consistencyScore: typeof remote.consistencyScore === "number" ? remote.consistencyScore : 0,
      consistencyBars: asNumberArray(remote.consistencyBars),
      heatmapWeeks: asNumberMatrix(remote.heatmapWeeks),
      collaboration: {
        prsMerged: typeof remote.collaboration?.prsMerged === "number" ? remote.collaboration.prsMerged : 0,
        codeReviews: typeof remote.collaboration?.codeReviews === "number" ? remote.collaboration.codeReviews : 0,
        issuesClosed: typeof remote.collaboration?.issuesClosed === "number" ? remote.collaboration.issuesClosed : 0,
      },
      languages: Array.isArray(remote.languages)
        ? remote.languages.filter(
            (lang): lang is { name: string; value: number } =>
              !!lang && typeof lang.name === "string" && typeof lang.value === "number"
          )
        : [],
      summary: remote.summary ?? "",
      repoIntelligence: Array.isArray(remote.repoIntelligence)
        ? remote.repoIntelligence.filter(
            (repo): repo is { name: string; impact: number } =>
              !!repo && typeof repo.name === "string" && typeof repo.impact === "number"
          )
        : [],
      repos,
      contributionStreak: typeof remote.contributionStreak === "number" ? remote.contributionStreak : 0,
      openSourceImpact: asStringArray(remote.openSourceImpact),
    };
  } catch {
    return EMPTY_DASHBOARD;
  }
};

export const getJobsData = async (): Promise<JobItem[]> => {
  if (!hasFirebaseConfig || !db) return FEATURED_JOBS;

  try {
    const snapshot = await getDocs(collection(db, "jobs"));
    if (snapshot.empty) return FEATURED_JOBS;

    return snapshot.docs
      .map((d) => normalizeJob(d.id, d.data() as Partial<JobItem>))
      .sort((a, b) => b.match - a.match);
  } catch {
    return FEATURED_JOBS;
  }
};

export const getRecommendedJobsForUser = async (uid: string): Promise<JobItem[]> => {
  const jobs = await getJobsData();
  if (!uid) return jobs;

  const dashboard = await getDashboardData(uid);
  const skillSet = new Set(dashboard.languages.map((lang) => lang.name.toLowerCase()));
  if (!skillSet.size) return jobs;

  return jobs
    .map((job) => {
      const tagMatches = job.tags.reduce((acc, tag) => {
        const normalizedTag = tag.toLowerCase();
        return skillSet.has(normalizedTag) ? acc + 1 : acc;
      }, 0);

      return {
        ...job,
        match: Math.min(99, job.match + tagMatches * 4),
      };
    })
    .sort((a, b) => b.match - a.match);
};

export const getApplicationsData = async (uid: string): Promise<ApplicationItem[]> => {
  if (!hasFirebaseConfig || !db || !uid) return [];

  try {
    const q = query(collection(db, "users", uid, "applications"), orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    return snapshot.docs.map((d) => normalizeApplication(d.id, d.data() as Record<string, unknown>));
  } catch {
    return [];
  }
};

export const saveApplication = async (uid: string, job: JobItem, status: ApplicationStatus, payload?: ApplyPayload): Promise<void> => {
  if (!hasFirebaseConfig || !db || !uid) return;

  const ref = doc(db, "users", uid, "applications", job.id);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      jobId: job.id,
      company: job.company,
      role: job.role,
      location: job.location,
      match: job.match,
      tags: job.tags,
      status,
      foot: buildFoot(status),
      applicantName: payload?.applicantName ?? existing.data()?.applicantName ?? "",
      applicantEmail: payload?.applicantEmail ?? existing.data()?.applicantEmail ?? "",
      portfolioUrl: payload?.portfolioUrl ?? existing.data()?.portfolioUrl ?? "",
      resumeUrl: payload?.resumeUrl ?? existing.data()?.resumeUrl ?? "",
      note: payload?.note ?? existing.data()?.note ?? "",
      createdAt: existing.exists() ? existing.data()?.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const updateApplicationStatus = async (uid: string, applicationId: string, status: ApplicationStatus): Promise<void> => {
  if (!hasFirebaseConfig || !db || !uid || !applicationId) return;

  await updateDoc(doc(db, "users", uid, "applications", applicationId), {
    status,
    foot: buildFoot(status),
    updatedAt: serverTimestamp(),
  });
};

export const getProfileData = async (uid: string): Promise<ProfileData | null> => {
  if (!hasFirebaseConfig || !db || !uid) return null;

  try {
    const snap = await getDoc(doc(db, "users", uid, "profile", "main"));
    if (!snap.exists()) return null;

    const remote = snap.data() as Partial<ProfileData>;
    return {
      name: remote.name ?? "",
      headline: remote.headline ?? "",
      bio: remote.bio ?? "",
      links: Array.isArray(remote.links)
        ? remote.links.filter(
            (link): link is { label: string; url: string } =>
              !!link && typeof link.label === "string" && typeof link.url === "string"
          )
        : [],
    };
  } catch {
    return null;
  }
};

export const updateProfileData = async (uid: string, payload: ProfileData): Promise<void> => {
  if (!hasFirebaseConfig || !db || !uid) return;

  const sanitizedLinks = (payload.links ?? [])
    .filter((link) => typeof link.label === "string" && typeof link.url === "string")
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => link.label.length > 0 && link.url.length > 0)
    .slice(0, 6);

  await setDoc(
    doc(db, "users", uid, "profile", "main"),
    {
      name: payload.name.trim(),
      headline: payload.headline.trim(),
      bio: payload.bio.trim(),
      links: sanitizedLinks,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
