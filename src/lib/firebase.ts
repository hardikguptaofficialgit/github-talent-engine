import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  GithubAuthProvider,
  User,
  UserCredential,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { Firestore, doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { syncGithubInsights } from "@/lib/github-sync";

const GITHUB_TOKEN_KEY = "opensourcehire.github.token";
const GITHUB_TOKEN_TS_KEY = "opensourcehire.github.token.ts";
const ENV_GITHUB_TOKEN: string = import.meta.env.VITE_GITHUB_TOKEN ?? "";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

const firebaseApp = hasFirebaseConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");
githubProvider.addScope("repo");
githubProvider.addScope("read:org");
githubProvider.setCustomParameters({
  prompt: "consent",
});

const storeGithubToken = (token?: string | null) => {
  if (typeof window === "undefined") return;
  if (!token) return;
  window.localStorage.setItem(GITHUB_TOKEN_KEY, token);
  window.localStorage.setItem(GITHUB_TOKEN_TS_KEY, String(Date.now()));
};

const getStoredGithubToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GITHUB_TOKEN_KEY);
};

const clearStoredGithubToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GITHUB_TOKEN_KEY);
  window.localStorage.removeItem(GITHUB_TOKEN_TS_KEY);
};

const loginWithGithub = async (): Promise<User | null> => {
  if (!auth) return null;
  const result: UserCredential = await signInWithPopup(auth, githubProvider);
  const credential = GithubAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (!db) {
    throw new Error("Database not available");
  }

  if (accessToken) {
    storeGithubToken(accessToken);
    try {
      await syncGithubInsights({
        firestore: db,
        uid: result.user.uid,
        accessToken,
        fallbackName: result.user.displayName,
        fallbackEmail: result.user.email,
      });
    } catch (error) {
      await syncGithubProfileFallback({ user: result.user, accessToken });
      console.error("GitHub insights sync failed:", error);
    }
  }

  return result.user;
};

const syncGithubInsightsWithToken = async ({
  user,
  accessToken,
}: {
  user: User;
  accessToken: string;
}): Promise<{ repoCount: number; privateRepoCount: number; publicRepoCount: number; reposWithFiles: number }> => {
  if (!db) {
    console.warn("[firebase] Firestore not available — skipping sync.");
    return { repoCount: 0, privateRepoCount: 0, publicRepoCount: 0, reposWithFiles: 0 };
  }

  // Use env token as ultimate fallback so sync never completely fails
  const effectiveToken = accessToken || ENV_GITHUB_TOKEN;
  if (!effectiveToken) {
    console.warn("[firebase] No GitHub token available (user token empty, no env fallback).");
    return { repoCount: 0, privateRepoCount: 0, publicRepoCount: 0, reposWithFiles: 0 };
  }

  console.log(`[firebase] syncGithubInsightsWithToken: uid=${user.uid}, token=${accessToken ? "user OAuth" : "env fallback"}`);
  return syncGithubInsights({
    firestore: db,
    uid: user.uid,
    accessToken: effectiveToken,
    fallbackName: user.displayName,
    fallbackEmail: user.email,
  });
};

const refreshGithubInsights = async (): Promise<{
  user: User | null;
  repoCount: number;
  privateRepoCount: number;
  publicRepoCount: number;
  reposWithFiles: number;
}> => {
  if (!auth || !db) {
    console.warn("[firebase] Auth or Firestore not available — cannot refresh.");
    return { user: null, repoCount: 0, privateRepoCount: 0, publicRepoCount: 0, reposWithFiles: 0 };
  }

  console.log("[firebase] refreshGithubInsights: opening GitHub OAuth popup...");
  const result: UserCredential = await signInWithPopup(auth, githubProvider);
  const credential = GithubAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (!accessToken) {
    throw new Error("GitHub OAuth succeeded but no access token was returned.");
  }

  console.log("[firebase] GitHub OAuth successful, storing token and syncing...");
  storeGithubToken(accessToken);

  let sync: { repoCount: number; privateRepoCount: number; publicRepoCount: number; reposWithFiles: number };
  try {
    sync = await syncGithubInsights({
      firestore: db,
      uid: result.user.uid,
      accessToken,
      fallbackName: result.user.displayName,
      fallbackEmail: result.user.email,
    });
  } catch (err) {
    console.warn("[firebase] Full sync failed after popup, using profile fallback:", err);
    const fallback = await syncGithubProfileFallback({ user: result.user, accessToken });
    sync = { repoCount: fallback.repoCount, privateRepoCount: 0, publicRepoCount: fallback.repoCount, reposWithFiles: 0 };
  }

  return { user: result.user, ...sync };
};

const logout = async (): Promise<void> => {
  if (!auth) return;
  clearStoredGithubToken();
  await signOut(auth);
};

const syncGithubProfileFallback = async ({
  user,
  accessToken,
}: {
  user: User;
  accessToken: string;
}): Promise<{ login: string | null; repoCount: number }> => {
  if (!db) return { login: null, repoCount: 0 };

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      return { login: null, repoCount: 0 };
    }

    const payload = (await response.json()) as {
      login?: string;
      name?: string | null;
      bio?: string | null;
      email?: string | null;
      blog?: string | null;
      html_url?: string;
      avatar_url?: string;
    };

    const login = typeof payload.login === "string" ? payload.login : null;
    const profileName = payload.name || user.displayName || login || "GitHub User";
    const profileBio =
      payload.bio ||
      `GitHub activity synced. Full insights pending; refresh to load repositories.`;

    let repos: Array<{
      full_name?: string;
      html_url?: string;
      private?: boolean;
      language?: string | null;
      stargazers_count?: number;
      pushed_at?: string;
      default_branch?: string;
    }> = [];

    if (login) {
      const repoResponse = await fetch(
        `https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=updated&per_page=12`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${accessToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
      if (repoResponse.ok) {
        const repoPayload = (await repoResponse.json()) as unknown;
        if (Array.isArray(repoPayload)) {
          repos = repoPayload.filter((repo) => !!repo && typeof repo === "object");
        }
      }
    }

    const reposGlimpse = repos.map((repo) => ({
      name: repo.full_name ?? "unknown/repo",
      url: repo.html_url ?? "",
      isPrivate: !!repo.private,
      language: repo.language ?? "Unknown",
      stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
      updatedAt: repo.pushed_at ?? "",
      files: [],
    }));

    const languageCounts = new Map<string, number>();
    repos.forEach((repo) => {
      const lang = repo.language;
      if (!lang) return;
      languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
    });
    const totalLangs = Array.from(languageCounts.values()).reduce((acc, value) => acc + value, 0);
    const languages = totalLangs
      ? Array.from(languageCounts.entries())
        .map(([name, count]) => ({ name, value: Math.round((count / totalLangs) * 100) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
      : [];

    await Promise.all([
      setDoc(
        doc(db, "users", user.uid, "github", "main"),
        {
          login: login ?? "",
          email: payload.email || user.email || "",
          avatarUrl: payload.avatar_url ?? user.photoURL ?? "",
          privateRepoCount: 0,
          publicRepoCount: 0,
          syncedAt: serverTimestamp(),
        },
        { merge: true }
      ),
      setDoc(
        doc(db, "users", user.uid, "profile", "main"),
        {
          name: profileName,
          headline: "GitHub Developer",
          bio: profileBio,
          links: [
            ...(payload.html_url ? [{ label: "GitHub", url: payload.html_url }] : []),
            ...(payload.blog ? [{ label: "Portfolio", url: payload.blog }] : []),
          ],
        },
        { merge: true }
      ),
      setDoc(
        doc(db, "users", user.uid, "dashboard", "main"),
        {
          heading: `Welcome back, ${profileName}`,
          subheading: repos.length
            ? `Loaded ${repos.length} recent public repositories from GitHub.`
            : "Basic GitHub profile loaded. Refresh to sync full insights.",
          contributionStrength: Math.min(90, Math.max(20, repos.length * 6)),
          consistencyScore: 0,
          consistencyBars: [],
          heatmapWeeks: [],
          collaboration: { prsMerged: 0, codeReviews: 0, issuesClosed: 0 },
          languages,
          summary: "Fallback summary based on public repository data.",
          repoIntelligence: [],
          repos: reposGlimpse,
          contributionStreak: 0,
          openSourceImpact: repos.length
            ? [`${repos.length} public repositories discovered from GitHub.`]
            : ["No public repositories found yet."],
        },
        { merge: true }
      ),
    ]);

    return { login, repoCount: repos.length };
  } catch {
    return { login: null, repoCount: 0 };
  }
};

const subscribeAuth = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
};

export {
  auth,
  db,
  hasFirebaseConfig,
  loginWithGithub,
  refreshGithubInsights,
  syncGithubInsightsWithToken,
  syncGithubProfileFallback,
  getStoredGithubToken,
  clearStoredGithubToken,
  logout,
  subscribeAuth,
};
