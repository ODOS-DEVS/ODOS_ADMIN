import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getAdminMe, loginAdmin, signupFirstAdmin } from "@/api/adminAuthApi";
import { setUnauthorizedHandler } from "@/api/client";
import type { AdminSession, AdminUser } from "@/types";
import {
  clearStoredAdminToken,
  getStoredAdminToken,
  setStoredAdminToken,
} from "@/utils/storage";

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

type AdminAuthContextValue = {
  adminUser: AdminUser | null;
  token: string | null;
  isHydrating: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  bootstrapSignup: (payload: SignupPayload) => Promise<void>;
  refreshAdminUser: () => Promise<void>;
  syncAdminUser: (user: AdminUser) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const storedToken = getStoredAdminToken();
      if (!storedToken) {
        setIsHydrating(false);
        return;
      }

      try {
        const user = await getAdminMe(storedToken);
        setToken(storedToken);
        setAdminUser(user);
      } catch {
        clearStoredAdminToken();
      } finally {
        setIsHydrating(false);
      }
    };

    void hydrate();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsSigningIn(true);
    try {
      const session: AdminSession = await loginAdmin(payload);
      if (!session.user.roles.includes("admin")) {
        throw new Error("This account does not have admin access.");
      }
      setStoredAdminToken(session.token);
      setToken(session.token);
      setAdminUser(session.user);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const refreshAdminUser = useCallback(async () => {
    const activeToken = token ?? getStoredAdminToken();
    if (!activeToken) {
      throw new Error("No admin session available.");
    }

    const user = await getAdminMe(activeToken);
    setToken(activeToken);
    setAdminUser(user);
  }, [token]);

  const syncAdminUser = useCallback((user: AdminUser) => {
    setAdminUser(user);
  }, []);

  const logout = useCallback(() => {
    clearStoredAdminToken();
    setToken(null);
    setAdminUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredAdminToken();
      setToken(null);
      setAdminUser(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const bootstrapSignup = useCallback(async (payload: SignupPayload) => {
    setIsSigningUp(true);
    try {
      const session: AdminSession = await signupFirstAdmin(payload);
      if (!session.user.roles.includes("admin")) {
        throw new Error("This account does not have admin access.");
      }
      setStoredAdminToken(session.token);
      setToken(session.token);
      setAdminUser(session.user);
    } finally {
      setIsSigningUp(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      adminUser,
      token,
      isHydrating,
      isSigningIn,
      isSigningUp,
      login,
      bootstrapSignup,
      refreshAdminUser,
      syncAdminUser,
      logout,
    }),
    [
      adminUser,
      bootstrapSignup,
      isHydrating,
      isSigningIn,
      isSigningUp,
      login,
      logout,
      refreshAdminUser,
      syncAdminUser,
      token,
    ],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return context;
}
