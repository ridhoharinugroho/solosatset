export interface LoginRequestDTO {
  identifier: string;
  password?: string;
}

export interface OtpSendRequestDTO {
  identifier: string;
  purpose?: "login" | "reset_password" | "register";
}

export interface OtpVerifyRequestDTO {
  identifier: string;
  otp: string;
}

export interface AuthSuccessResponseDTO<U = unknown> {
  success: true;
  user: U;
  message?: string;
}

export interface AuthErrorResponseDTO {
  success: false;
  error: string;
}

export type AuthResponseDTO<U = unknown> = AuthSuccessResponseDTO<U> | AuthErrorResponseDTO;
