import type { LoginRequestDTO, AuthResponseDTO } from "./auth.dto";
import type { LoginCredentials, AuthResult } from "./auth.contract";

export function mapLoginCredentials(raw: Partial<LoginCredentials> | Record<string, unknown>): LoginCredentials {
  return {
    identifier: String(raw?.identifier ?? "").trim(),
    password: raw?.password ? String(raw.password) : undefined,
  };
}

export function mapLoginRequestDto(credentials: LoginCredentials): LoginRequestDTO {
  return {
    identifier: credentials.identifier.trim(),
    password: credentials.password,
  };
}

export function mapAuthResult<U, D>(
  dto: AuthResponseDTO<D>,
  userMapper: (userDto: D) => U
): AuthResult<U> {
  if (!dto || typeof dto !== "object") {
    return {
      isAuthenticated: false,
      error: "Respons otentikasi tidak valid.",
    };
  }

  if (dto.success === true && dto.user) {
    return {
      isAuthenticated: true,
      user: userMapper(dto.user),
    };
  }

  return {
    isAuthenticated: false,
    error: "error" in dto ? dto.error : "Gagal melakukan otentikasi.",
  };
}
