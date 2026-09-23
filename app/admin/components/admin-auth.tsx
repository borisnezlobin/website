"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PASSWORD_STORAGE_KEY = "admin_password";

type AuthPhase = "restoring" | "signed-out" | "signed-in";

type AdminAuthValue = {
  phase: AuthPhase;
  password: string;
  wasRejected: boolean;
  signIn: (password: string) => void;
  signOut: () => void;
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function readStoredPassword(): string {
  try {
    return localStorage.getItem(PASSWORD_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredPassword(password: string | null) {
  try {
    if (password) localStorage.setItem(PASSWORD_STORAGE_KEY, password);
    else localStorage.removeItem(PASSWORD_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session still works in memory.
  }
}

function withAuthorization(init: RequestInit | undefined, password: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${password}`);
  return { ...init, headers };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<AuthPhase>("restoring");
  const [password, setPassword] = useState("");
  const [wasRejected, setWasRejected] = useState(false);

  useEffect(() => {
    const stored = readStoredPassword();
    setPassword(stored);
    setPhase(stored ? "signed-in" : "signed-out");
  }, []);

  const signIn = useCallback((next: string) => {
    writeStoredPassword(next);
    setPassword(next);
    setWasRejected(false);
    setPhase("signed-in");
  }, []);

  const signOut = useCallback(() => {
    writeStoredPassword(null);
    setPassword("");
    setPhase("signed-out");
  }, []);

  const adminFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(path, withAuthorization(init, password));
      if (res.status === 401) {
        signOut();
        setWasRejected(true);
      }
      return res;
    },
    [password, signOut],
  );

  const value = useMemo(
    () => ({ phase, password, wasRejected, signIn, signOut, adminFetch }),
    [phase, password, wasRejected, signIn, signOut, adminFetch],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return value;
}
