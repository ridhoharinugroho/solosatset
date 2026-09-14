export interface LoginCredentials {
  identifier: string;
  password?: string;
}

export interface OtpChallenge {
  identifier: string;
  otpCode: string;
  purpose: "login" | "reset_password" | "register";
}

export interface AuthResult<U = unknown> {
  isAuthenticated: boolean;
  user?: U;
  error?: string;
}
