import type { ApiResponseDTO, ApiErrorResponseDTO } from "./api.dto";
import type { ApiResponse, ApiError } from "./api.contract";

export function mapApiResponse<T>(dto: ApiResponseDTO<T>): ApiResponse<T> {
  if (!dto || typeof dto !== "object") {
    return {
      success: false,
      error: "Response API tidak valid.",
    };
  }

  if (dto.success === true) {
    return {
      success: true,
      data: dto.data ?? (dto as unknown as T),
    };
  }

  const errorDto = dto as ApiErrorResponseDTO;
  return {
    success: false,
    error: errorDto.error || "Terjadi kesalahan pada server.",
    errorCode: errorDto.code,
  };
}

export function mapApiError(error: unknown): ApiError {
  if (typeof error === "string") {
    return { message: error };
  }
  if (error && typeof error === "object" && error !== null && "message" in error && typeof (error as { message: unknown }).message === "string") {
    const errObj = error as { message: string; code?: string | number };
    return {
      message: errObj.message,
      code: errObj.code,
    };
  }
  return { message: "Terjadi kesalahan tidak dikenal." };
}
