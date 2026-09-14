import { useState, useEffect, useCallback } from "react";
import { fetchAdminSessionApi, loginAdminApi, logoutAdminApi } from "../services/adminService";

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  exp?: number;
}

export interface UseAdminAuthReturn {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  checkSession: () => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const ADMIN_AUTH_KEY = "pusat_barkas_admin_auth";

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setSecurityValidated = (val: boolean) => {
    if (typeof window !== "undefined") {
      const sec = (window as unknown as Record<string, unknown>).__sopalokaAdminSecurity as
        | { setValidated?: (v: boolean) => void }
        | undefined;
      sec?.setValidated?.(val);
    }
  };

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetchAdminSessionApi();

      if (res.authenticated && res.user) {
        setIsAuthenticated(true);
        setUser(res.user);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
          setSecurityValidated(true);
        }
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(ADMIN_AUTH_KEY);
          setSecurityValidated(false);
        }
        return false;
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(ADMIN_AUTH_KEY);
        setSecurityValidated(false);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginAdminApi(username, password);
      if (!res.authenticated || !res.user) {
        setError(res.error || "Login admin gagal. Username atau Password salah.");
        setIsAuthenticated(false);
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(ADMIN_AUTH_KEY);
          setSecurityValidated(false);
        }
        return false;
      }

      setIsAuthenticated(true);
      setUser(res.user);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
        setSecurityValidated(true);
      }
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal terhubung ke layanan otentikasi admin.";
      setError(errMsg);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutAdminApi();
    } catch (_) {
      // Ignored
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(ADMIN_AUTH_KEY);
        try {
          sessionStorage.clear();
        } catch (_) {}
        setSecurityValidated(false);
      }
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    checkSession,
    login,
    logout,
  };
}
