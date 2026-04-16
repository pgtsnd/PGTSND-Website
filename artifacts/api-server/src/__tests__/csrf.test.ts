import { describe, it, expect, beforeAll } from "vitest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import {
  csrfMiddleware,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "../middleware/csrf";

function buildApp(): Express {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(csrfMiddleware);

  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true });
  });
  app.post("/api/things", (_req, res) => {
    res.json({ created: true });
  });
  app.put("/api/things/:id", (_req, res) => {
    res.json({ updated: true });
  });
  app.delete("/api/things/:id", (_req, res) => {
    res.json({ deleted: true });
  });
  app.post("/api/webhooks/stripe", (_req, res) => {
    res.json({ webhook: "stripe" });
  });
  app.post("/api/webhooks/docusign", (_req, res) => {
    res.json({ webhook: "docusign" });
  });
  app.get("/api/auth/google/callback", (_req, res) => {
    res.json({ callback: true });
  });

  return app;
}

function parseCsrfCookie(setCookieHeader: string[] | string | undefined): {
  raw: string;
  token: string;
} | null {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  const csrf = cookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!csrf) return null;
  const value = csrf.split(";")[0];
  const token = value.substring(CSRF_COOKIE_NAME.length + 1);
  return { raw: value, token };
}

describe("csrfMiddleware", () => {
  let app: Express;

  beforeAll(() => {
    app = buildApp();
  });

  it("issues a CSRF cookie on GET requests", async () => {
    const res = await request(app).get("/api/ping").expect(200);

    const parsed = parseCsrfCookie(res.headers["set-cookie"]);
    expect(parsed).not.toBeNull();
    expect(parsed!.token).toMatch(/^[a-f0-9]{64}$/);
    expect(res.body).toEqual({ ok: true });
  });

  it("does not re-issue a cookie when the client already has one", async () => {
    const first = await request(app).get("/api/ping").expect(200);
    const parsed = parseCsrfCookie(first.headers["set-cookie"]);
    expect(parsed).not.toBeNull();

    const second = await request(app)
      .get("/api/ping")
      .set("Cookie", parsed!.raw)
      .expect(200);

    expect(second.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects POST without a CSRF header (403)", async () => {
    const get = await request(app).get("/api/ping").expect(200);
    const parsed = parseCsrfCookie(get.headers["set-cookie"])!;

    const res = await request(app)
      .post("/api/things")
      .set("Cookie", parsed.raw)
      .send({ name: "x" })
      .expect(403);

    expect(res.body).toEqual({ error: "Invalid or missing CSRF token" });
  });

  it("rejects PUT without a CSRF header (403)", async () => {
    const get = await request(app).get("/api/ping").expect(200);
    const parsed = parseCsrfCookie(get.headers["set-cookie"])!;

    await request(app)
      .put("/api/things/1")
      .set("Cookie", parsed.raw)
      .send({ name: "y" })
      .expect(403);
  });

  it("rejects DELETE without a CSRF header (403)", async () => {
    const get = await request(app).get("/api/ping").expect(200);
    const parsed = parseCsrfCookie(get.headers["set-cookie"])!;

    await request(app)
      .delete("/api/things/1")
      .set("Cookie", parsed.raw)
      .expect(403);
  });

  it("rejects POST when header token does not match cookie token (403)", async () => {
    const get = await request(app).get("/api/ping").expect(200);
    const parsed = parseCsrfCookie(get.headers["set-cookie"])!;

    await request(app)
      .post("/api/things")
      .set("Cookie", parsed.raw)
      .set(CSRF_HEADER_NAME, "not-the-real-token")
      .send({ name: "x" })
      .expect(403);
  });

  it("accepts POST with a matching CSRF header", async () => {
    const get = await request(app).get("/api/ping").expect(200);
    const parsed = parseCsrfCookie(get.headers["set-cookie"])!;

    const res = await request(app)
      .post("/api/things")
      .set("Cookie", parsed.raw)
      .set(CSRF_HEADER_NAME, parsed.token)
      .send({ name: "x" })
      .expect(200);

    expect(res.body).toEqual({ created: true });
  });

  it("accepts PUT and DELETE with a matching CSRF header", async () => {
    const get = await request(app).get("/api/ping").expect(200);
    const parsed = parseCsrfCookie(get.headers["set-cookie"])!;

    await request(app)
      .put("/api/things/42")
      .set("Cookie", parsed.raw)
      .set(CSRF_HEADER_NAME, parsed.token)
      .send({ name: "y" })
      .expect(200);

    await request(app)
      .delete("/api/things/42")
      .set("Cookie", parsed.raw)
      .set(CSRF_HEADER_NAME, parsed.token)
      .expect(200);
  });

  it("rejects POST when no CSRF cookie has been issued and no header sent", async () => {
    await request(app).post("/api/things").send({ name: "x" }).expect(403);
  });

  it("bypasses CSRF for /api/webhooks/* routes", async () => {
    const stripe = await request(app)
      .post("/api/webhooks/stripe")
      .send({ id: "evt_1" })
      .expect(200);
    expect(stripe.body).toEqual({ webhook: "stripe" });

    const docu = await request(app)
      .post("/api/webhooks/docusign")
      .send({ id: "env_1" })
      .expect(200);
    expect(docu.body).toEqual({ webhook: "docusign" });
  });

  it("bypasses CSRF for the Google OAuth callback", async () => {
    const res = await request(app)
      .get("/api/auth/google/callback?code=abc")
      .expect(200);
    expect(res.body).toEqual({ callback: true });
  });
});
