import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import request from "supertest";

const sendEmailMock = vi.fn();

vi.mock("../services/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...(args as [])),
  getAppBaseUrl: () => "http://localhost:5000",
}));

let currentRole: "owner" | "partner" | "crew" | "client" | "anon" = "owner";

vi.mock("../middleware/auth", () => ({
  requireRole:
    (...allowed: Array<"owner" | "partner" | "crew" | "client">) =>
    (req: Request, res: Response, next: NextFunction) => {
      if (currentRole === "anon") {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!allowed.includes(currentRole as any)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      (req as any).user = {
        id: "u1",
        role: currentRole,
        email: "u1@x.com",
        name: "U",
      };
      next();
    },
}));

import adminEmailPreviewsRouter from "../routes/admin-email-previews";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api", adminEmailPreviewsRouter);
  return app;
}

describe("POST /api/admin/email-previews/:id/send", () => {
  let app: Express;
  const ORIGINAL_KEY = process.env.RESEND_API_KEY;

  beforeEach(() => {
    sendEmailMock.mockReset();
    currentRole = "owner";
    process.env.RESEND_API_KEY = "test-key";
    app = buildApp();
  });

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = ORIGINAL_KEY;
  });

  it("happy path: dispatches via sendEmail and returns ok", async () => {
    sendEmailMock.mockResolvedValueOnce({ ok: true });

    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, recipient: "tester@example.com" });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
      text: string;
    };
    expect(args.to).toBe("tester@example.com");
    expect(args.subject.startsWith("[TEST]")).toBe(true);
    expect(args.html).toContain("<");
    expect(args.text.length).toBeGreaterThan(0);
  });

  it("trims whitespace from the recipient before sending", async () => {
    sendEmailMock.mockResolvedValueOnce({ ok: true });

    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "  tester@example.com  " });

    expect(res.status).toBe(200);
    expect((sendEmailMock.mock.calls[0][0] as { to: string }).to).toBe(
      "tester@example.com",
    );
  });

  it("returns 400 for an invalid recipient and does not call sendEmail", async () => {
    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid recipient/i);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing recipient", async () => {
    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({});

    expect(res.status).toBe(400);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown template id", async () => {
    const res = await request(app)
      .post("/api/admin/email-previews/does-not-exist/send")
      .send({ recipient: "tester@example.com" });

    expect(res.status).toBe(404);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns 503 when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/RESEND_API_KEY/);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the email provider rejects the send", async () => {
    sendEmailMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      error: "invalid_to",
    });

    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/invalid_to/);
  });

  it("returns 503 when sendEmail reports a skip (defensive)", async () => {
    sendEmailMock.mockResolvedValueOnce({
      ok: true,
      skipped: true,
      reason: "no-api-key",
    });

    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });

    expect(res.status).toBe(503);
  });

  it("returns 500 when sendEmail throws unexpectedly", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("boom"));

    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });

    expect(res.status).toBe(500);
  });

  it("rejects non-admin roles via requireRole (403 for crew)", async () => {
    currentRole = "crew";
    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });
    expect(res.status).toBe(403);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers (401)", async () => {
    currentRole = "anon";
    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });
    expect(res.status).toBe(401);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("allows partner role", async () => {
    currentRole = "partner";
    sendEmailMock.mockResolvedValueOnce({ ok: true });
    const res = await request(app)
      .post("/api/admin/email-previews/review-ready/send")
      .send({ recipient: "tester@example.com" });
    expect(res.status).toBe(200);
  });
});
