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
import { Firestore, getFirestore } from "firebase/firestore";
import { syncGithubInsights } from "@/lib/github-sync";

const GITHUB_TOKEN_KEY = "opensourcehire.github.token";
const GITHUB_TOKEN_TS_KEY = "opensourcehire.github.token.ts";
const ENV_GITHUB_TOKEN: string = import.meta.env.VITE_GITHUB_TOKEN ?? "";
const hasConfiguredGithubToken = Boolean(ENV_GITHUB_TOKEN);

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
    await syncGithubInsights({
      firestore: db,
      uid: result.user.uid,
      accessToken,
      displayName: result.user.displayName,
      email: result.user.email,
    });
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
    throw new Error("Firestore is not configured. Add Firebase environment variables and redeploy.");
  }

  const effectiveToken = accessToken || ENV_GITHUB_TOKEN;
  if (!effectiveToken) {
    throw new Error("No GitHub token available. Add VITE_GITHUB_TOKEN in Vercel or re-authorize GitHub.");
  }

  console.log(`[firebase] syncGithubInsightsWithToken: uid=${user.uid}, token=${accessToken ? "user OAuth" : "configured token"}`);
  return syncGithubInsights({
    firestore: db,
    uid: user.uid,
    accessToken: effectiveToken,
    displayName: user.displayName,
    email: user.email,
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
    console.warn("[firebase] Auth or Firestore not available; cannot refresh.");
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

  const sync = await syncGithubInsights({
    firestore: db,
    uid: result.user.uid,
    accessToken,
    displayName: result.user.displayName,
    email: result.user.email,
  });

  return { user: result.user, ...sync };
};

const logout = async (): Promise<void> => {
  if (!auth) return;
  clearStoredGithubToken();
  await signOut(auth);
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
  hasConfiguredGithubToken,
  loginWithGithub,
  refreshGithubInsights,
  syncGithubInsightsWithToken,
  getStoredGithubToken,
  clearStoredGithubToken,
  logout,
  subscribeAuth,
};
