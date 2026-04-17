import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../lib/unsubscribe-token";

describe("unsubscribe token", () => {
  it("round-trips a valid token", () => {
    const token = createUnsubscribeToken("dormant-tokens", "user-123");
    const verified = verifyUnsubscribeToken("dormant-tokens", token);
    expect(verified).toEqual({ userId: "user-123" });
  });

  it("rejects a tampered payload", () => {
    const token = createUnsubscribeToken("dormant-tokens", "user-123");
    const [body, sig] = token.split(".");
    void body;
    const tampered = `${Buffer.from(`dormant-tokens:hacker:${Date.now()}`).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}.${sig}`;
    expect(verifyUnsubscribeToken("dormant-tokens", tampered)).toBeNull();
  });

  it("rejects a token whose issued-at is older than the TTL", () => {
    const issuedAt = Date.now() - 100 * 24 * 60 * 60 * 1000; // 100 days ago
    const token = createUnsubscribeToken("dormant-tokens", "user-123", {
      issuedAt,
    });
    expect(verifyUnsubscribeToken("dormant-tokens", token)).toBeNull();
  });

  it("accepts a token issued just inside the TTL window", () => {
    const issuedAt = Date.now() - 89 * 24 * 60 * 60 * 1000; // 89 days ago
    const token = createUnsubscribeToken("dormant-tokens", "user-123", {
      issuedAt,
    });
    expect(verifyUnsubscribeToken("dormant-tokens", token)).toEqual({
      userId: "user-123",
    });
  });

  it("accepts a token issued exactly at the TTL boundary (TTL is inclusive)", () => {
    const now = Date.now();
    const ttlMs = 1000;
    const token = createUnsubscribeToken("dormant-tokens", "user-123", {
      issuedAt: now - ttlMs,
    });
    expect(
      verifyUnsubscribeToken("dormant-tokens", token, { now, ttlMs }),
    ).toEqual({ userId: "user-123" });
    // One ms older must be rejected.
    const expired = createUnsubscribeToken("dormant-tokens", "user-123", {
      issuedAt: now - ttlMs - 1,
    });
    expect(
      verifyUnsubscribeToken("dormant-tokens", expired, { now, ttlMs }),
    ).toBeNull();
  });

  it("rejects a token older than a custom TTL passed to verify", () => {
    const issuedAt = Date.now() - 10 * 1000;
    const token = createUnsubscribeToken("dormant-tokens", "user-123", {
      issuedAt,
    });
    expect(
      verifyUnsubscribeToken("dormant-tokens", token, { ttlMs: 1000 }),
    ).toBeNull();
  });

  it("rejects a legacy token that has no issued-at component", () => {
    // Manually construct a payload in the old `kind:userId` format and sign
    // it the same way the lib used to. Such a token must no longer verify.
    const payload = "dormant-tokens:user-123";
    const b64 = Buffer.from(payload, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const sig = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "dev-jwt-secret-change-in-production")
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const legacy = `${b64}.${sig}`;
    expect(verifyUnsubscribeToken("dormant-tokens", legacy)).toBeNull();
  });

  it("rejects a token whose issued-at is far in the future", () => {
    const issuedAt = Date.now() + 24 * 60 * 60 * 1000; // 1 day in the future
    const token = createUnsubscribeToken("dormant-tokens", "user-123", {
      issuedAt,
    });
    expect(verifyUnsubscribeToken("dormant-tokens", token)).toBeNull();
  });

  it("rejects a bad signature", () => {
    const token = createUnsubscribeToken("dormant-tokens", "user-123");
    expect(
      verifyUnsubscribeToken("dormant-tokens", token.slice(0, -2) + "aa"),
    ).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifyUnsubscribeToken("dormant-tokens", "")).toBeNull();
    expect(verifyUnsubscribeToken("dormant-tokens", "not-a-token")).toBeNull();
    expect(verifyUnsubscribeToken("dormant-tokens", "a.b")).toBeNull();
  });
});
