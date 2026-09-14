export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string | number;
}

export interface ApiError {
  message: string;
  code?: string | number;
}
