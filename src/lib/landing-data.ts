import { doc, getDoc } from "firebase/firestore";
import { db, hasFirebaseConfig } from "@/lib/firebase";

export type LandingData = {
  contributionScore: number;
  contributionCount: number;
  topRepoName: string;
  topRepoStats: string;
  topRepoTags: string[];
  roleMatch: number;
  roleTitle: string;
  roleMeta: string;
};

export const getLandingData = async (): Promise<LandingData | null> => {
  if (!hasFirebaseConfig || !db) return null;

  try {
    const snap = await getDoc(doc(db, "public", "landing"));
    if (!snap.exists()) return null;

    const remote = snap.data() as Partial<LandingData>;
    return {
      contributionScore: typeof remote.contributionScore === "number" ? remote.contributionScore : 0,
      contributionCount: typeof remote.contributionCount === "number" ? remote.contributionCount : 0,
      topRepoName: remote.topRepoName ?? "",
      topRepoStats: remote.topRepoStats ?? "",
      topRepoTags: Array.isArray(remote.topRepoTags)
        ? remote.topRepoTags.filter((tag): tag is string => typeof tag === "string").slice(0, 4)
        : [],
      roleMatch: typeof remote.roleMatch === "number" ? remote.roleMatch : 0,
      roleTitle: remote.roleTitle ?? "",
      roleMeta: remote.roleMeta ?? "",
    };
  } catch {
    return null;
  }
};
