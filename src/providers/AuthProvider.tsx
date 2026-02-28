import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { loginWithGithub, logout, subscribeAuth } from "@/lib/firebase";

const DEMO_MODE_KEY = "opensourcehire.demo.mode";
const DEMO_UID = "demo-user";

const createDemoUser = (): User =>
  ({
    uid: DEMO_UID,
    displayName: "Hardik Gupta",
    email: "hardik@konvergehack.in",
    photoURL: "https://api.dicebear.com/9.x/thumbs/svg?seed=Hardik%20Gupta",
  } as User);

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: () => Promise<User | null>;
  loginDemo: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DEMO_MODE_KEY) === "1";
  });

  useEffect(() => {
    if (demoMode) {
      setUser(createDemoUser());
      setLoading(false);
      return () => undefined;
    }

    const unsub = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });

    return unsub;
  }, [demoMode]);

  const loginDemo = async (): Promise<User | null> => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_MODE_KEY, "1");
    }
    const demoUser = createDemoUser();
    setDemoMode(true);
    setUser(demoUser);
    setLoading(false);
    return demoUser;
  };

  const signOutUser = async (): Promise<void> => {
    if (demoMode) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DEMO_MODE_KEY);
      }
      setDemoMode(false);
      setUser(null);
      return;
    }
    await logout();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: loginWithGithub,
      loginDemo,
      signOutUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

