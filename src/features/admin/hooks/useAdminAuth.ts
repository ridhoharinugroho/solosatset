import { useState, useEffect, useCallback } from "react";

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
const SESSION_ENDPOINT = "/api/admin-auth";

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setSecurityValidated = (val: boolean) => {
    if (typeof window !== "undefined") {
      const sec = (window as unknown as Record<string, unknown>).__solosatsetAdminSecurity as
        | { setValidated?: (v: boolean) => void }
        | undefined;
      sec?.setValidated?.(val);
    }
  };

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${SESSION_ENDPOINT}?action=session`, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        setIsAuthenticated(false);
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(ADMIN_AUTH_KEY);
          setSecurityValidated(false);
        }
        return false;
      }

      const payload = await response.json();
      if (payload?.authenticated && payload?.user) {
        setIsAuthenticated(true);
        setUser(payload.user);
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
      const response = await fetch(`${SESSION_ENDPOINT}?action=login`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.authenticated) {
        const errMsg = payload?.error || "Login admin gagal. Username atau Password salah.";
        setError(errMsg);
        setIsAuthenticated(false);
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(ADMIN_AUTH_KEY);
          setSecurityValidated(false);
        }
        return false;
      }

      setIsAuthenticated(true);
      setUser(payload.user);
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
      await fetch(`${SESSION_ENDPOINT}?action=logout`, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
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
