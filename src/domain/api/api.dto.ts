export interface ApiSuccessResponseDTO<T = unknown> {
  success: true;
  data?: T;
  [key: string]: unknown;
}

export interface ApiErrorResponseDTO {
  success: false;
  error: string;
  code?: string | number;
}

export type ApiResponseDTO<T = unknown> = ApiSuccessResponseDTO<T> | ApiErrorResponseDTO;
