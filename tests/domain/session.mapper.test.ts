import { describe, it, expect } from "vitest";
import { mapSessionPayloadToDomain } from "../../src/domain/session/session.mapper";

describe("Session Domain Mapper", () => {
  it("harus memetakan JWT payload aktif ke UserSession domain valid", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
      sub: "usr-99",
      role: "user",
      iat: Math.floor(Date.now() / 1000),
      exp: futureTimestamp,
      nonce: "abc123nonce",
    };

    const session = mapSessionPayloadToDomain(payload);

    expect(session.userId).toBe("usr-99");
    expect(session.role).toBe("user");
    expect(session.isValid).toBe(true);
  });

  it("harus menandai sesi tidak valid jika sudah expired", () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
    const payload = {
      sub: "usr-99",
      role: "user",
      iat: pastTimestamp - 3600,
      exp: pastTimestamp,
      nonce: "expirednonce",
    };

    const session = mapSessionPayloadToDomain(payload);

    expect(session.userId).toBe("usr-99");
    expect(session.isValid).toBe(false);
  });

  it("harus merespons aman saat payload null atau undefined", () => {
    const session = mapSessionPayloadToDomain(null);

    expect(session.userId).toBe("");
    expect(session.role).toBe("guest");
    expect(session.isValid).toBe(false);
  });
});
