import { describe, it, expect } from "vitest";
import { mapLoginCredentials, mapLoginRequestDto, mapAuthResult } from "../../src/domain/auth/auth.mapper";

describe("Auth Domain Mapper", () => {
  it("harus menormalisasi kredensial login", () => {
    const creds = mapLoginCredentials({
      identifier: " 081234567890 ",
      password: "secretpassword ",
    });

    expect(creds.identifier).toBe("081234567890");
    expect(creds.password).toBe("secretpassword ");
  });

  it("harus memetakan kredensial ke LoginRequestDTO", () => {
    const dto = mapLoginRequestDto({
      identifier: "user@example.com",
      password: "pass",
    });

    expect(dto.identifier).toBe("user@example.com");
    expect(dto.password).toBe("pass");
  });

  it("harus memetakan respons sukses otentikasi ke AuthResult domain", () => {
    const mockUserDto = { id: "usr-01", name: "Budi" };
    const mockUserMapper = (dto: typeof mockUserDto) => ({ id: dto.id, name: dto.name });

    const result = mapAuthResult(
      { success: true, user: mockUserDto },
      mockUserMapper
    );

    expect(result.isAuthenticated).toBe(true);
    expect(result.user?.id).toBe("usr-01");
    expect(result.error).toBeUndefined();
  });

  it("harus memetakan respons gagal otentikasi", () => {
    const result = mapAuthResult(
      { success: false, error: "Password salah" },
      (dto) => dto
    );

    expect(result.isAuthenticated).toBe(false);
    expect(result.error).toBe("Password salah");
  });
});
