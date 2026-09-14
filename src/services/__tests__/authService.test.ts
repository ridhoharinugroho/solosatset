import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loginUser, AuthError, getCurrentUser, setCurrentUser } from "../authService";

describe("authService postJson & AuthError Unit Tests", () => {
  beforeEach(() => {
    setCurrentUser(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws AuthError with category 'invalid_credentials' when login fails with invalid credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: "Kredensial login tidak sesuai.", code: "INVALID_CREDENTIALS" }),
    } as Response);

    await expect(loginUser("user@example.com", "wrongpass")).rejects.toThrow(AuthError);
    try {
      await loginUser("user@example.com", "wrongpass");
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthError);
      expect(err.category).toBe("invalid_credentials");
    }
  });

  it("throws AuthError with category 'network_error' when fetch fails due to network disconnect", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    try {
      await loginUser("user@example.com", "anypass");
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthError);
      expect(err.category).toBe("network_error");
      expect(err.message).toContain("Koneksi terputus");
    }
  });

  it("throws AuthError with category 'timeout' when fetch aborts due to timeout", async () => {
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";
    global.fetch = vi.fn().mockRejectedValue(abortErr);

    try {
      await loginUser("user@example.com", "anypass");
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthError);
      expect(err.category).toBe("timeout");
      expect(err.message).toContain("Waktu koneksi ke server habis");
    }
  });
});
