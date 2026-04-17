import { describe, it, expect } from "vitest";
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
    const tampered = `${Buffer.from("dormant-tokens:hacker").toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}.${sig}`;
    expect(verifyUnsubscribeToken("dormant-tokens", tampered)).toBeNull();
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
