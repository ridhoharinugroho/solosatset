import { useState, useCallback } from "react";
import type { UserProfile } from "../../../domain/user/user.contract";
import type { AuthResult } from "../../../domain/auth/auth.contract";

export type AuthMode = "login" | "register" | "otp" | "reset_password";

export interface UseAuthProps {
  initialUser?: UserProfile | null;
  initialMode?: AuthMode;
  onLoginSubmit?: (identifier: string, password?: string) => Promise<AuthResult<UserProfile>>;
  onRegisterSubmit?: (data: { name: string; identifier: string; storeName?: string; password?: string }) => Promise<AuthResult<UserProfile>>;
  onOtpSubmit?: (identifier: string, otp: string) => Promise<AuthResult<UserProfile>>;
  onResetPasswordSubmit?: (identifier: string) => Promise<AuthResult<boolean>>;
}

export function useAuth({
  initialUser = null,
  initialMode = "login",
  onLoginSubmit,
  onRegisterSubmit,
  onOtpSubmit,
  onResetPasswordSubmit,
}: UseAuthProps = {}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [otpIdentifier, setOtpIdentifier] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  }, []);

  const handleLogin = useCallback(
    async (identifier: string, password?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        if (onLoginSubmit) {
          const result = await onLoginSubmit(identifier, password);
          if (result.isAuthenticated && result.user) {
            setUser(result.user);
            setIsLoading(false);
            return true;
          }
          setError(result.error || "Gagal melakukan login.");
          setIsLoading(false);
          return false;
        }
        setIsLoading(false);
        return false;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem saat login.");
        setIsLoading(false);
        return false;
      }
    },
    [onLoginSubmit]
  );

  const handleRegister = useCallback(
    async (data: { name: string; identifier: string; storeName?: string; password?: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        if (onRegisterSubmit) {
          const result = await onRegisterSubmit(data);
          if (result.isAuthenticated && result.user) {
            setUser(result.user);
            setIsLoading(false);
            return true;
          }
          setError(result.error || "Gagal mendaftarkan akun.");
          setIsLoading(false);
          return false;
        }
        setIsLoading(false);
        return false;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran.");
        setIsLoading(false);
        return false;
      }
    },
    [onRegisterSubmit]
  );

  const handleSendOtp = useCallback((identifier: string) => {
    setOtpIdentifier(identifier);
    switchMode("otp");
  }, [switchMode]);

  const handleVerifyOtp = useCallback(
    async (otpCode: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        if (onOtpSubmit) {
          const result = await onOtpSubmit(otpIdentifier, otpCode);
          if (result.isAuthenticated && result.user) {
            setUser(result.user);
            setIsLoading(false);
            return true;
          }
          setError(result.error || "Kode OTP tidak valid.");
          setIsLoading(false);
          return false;
        }
        setIsLoading(false);
        return false;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal verifikasi OTP.");
        setIsLoading(false);
        return false;
      }
    },
    [onOtpSubmit, otpIdentifier]
  );

  const handleResetPassword = useCallback(
    async (identifier: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        if (onResetPasswordSubmit) {
          const result = await onResetPasswordSubmit(identifier);
          setIsLoading(false);
          return Boolean(result.isAuthenticated);
        }
        setIsLoading(false);
        return false;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal mengirim petunjuk reset password.");
        setIsLoading(false);
        return false;
      }
    },
    [onResetPasswordSubmit]
  );

  const logout = useCallback(() => {
    setUser(null);
    setMode("login");
    setError(null);
  }, []);

  return {
    user,
    mode,
    isLoading,
    error,
    otpIdentifier,
    switchMode,
    handleLogin,
    handleRegister,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    logout,
  };
}
