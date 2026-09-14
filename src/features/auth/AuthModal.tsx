import React from "react";
import { useAuth, UseAuthProps } from "./hooks/useAuth";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { OtpForm } from "./components/OtpForm";
import { ResetPasswordForm } from "./components/ResetPasswordForm";

export interface AuthModalProps extends UseAuthProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialUser,
  initialMode = "login",
  onLoginSubmit,
  onRegisterSubmit,
  onOtpSubmit,
  onResetPasswordSubmit,
  className = "",
}) => {
  const {
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
  } = useAuth({
    initialUser,
    initialMode,
    onLoginSubmit,
    onRegisterSubmit,
    onOtpSubmit,
    onResetPasswordSubmit,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 ${className}`.trim()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal auth"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs transition-colors"
        >
          ✕
        </button>

        {mode === "login" && (
          <LoginForm
            onSubmit={async (id, pass) => {
              const ok = await handleLogin(id, pass);
              if (ok) onClose();
              return ok;
            }}
            onSwitchToRegister={() => switchMode("register")}
            onSwitchToResetPassword={() => switchMode("reset_password")}
            onSendOtp={(id) => handleSendOtp(id)}
            isLoading={isLoading}
            error={error}
          />
        )}

        {mode === "register" && (
          <RegisterForm
            onSubmit={async (data) => {
              const ok = await handleRegister(data);
              if (ok) onClose();
              return ok;
            }}
            onSwitchToLogin={() => switchMode("login")}
            isLoading={isLoading}
            error={error}
          />
        )}

        {mode === "otp" && (
          <OtpForm
            identifier={otpIdentifier}
            onVerify={async (otp) => {
              const ok = await handleVerifyOtp(otp);
              if (ok) onClose();
              return ok;
            }}
            onBackToLogin={() => switchMode("login")}
            isLoading={isLoading}
            error={error}
          />
        )}

        {mode === "reset_password" && (
          <ResetPasswordForm
            onSubmit={async (id) => handleResetPassword(id)}
            onBackToLogin={() => switchMode("login")}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};
