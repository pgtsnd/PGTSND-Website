import { describe, it, expect, beforeEach, vi } from "vitest";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import request from "supertest";

vi.mock("../services/email", () => ({
  sendEmail: vi.fn(),
  getAppBaseUrl: () => "http://localhost:5000",
}));

vi.mock("../middleware/auth", () => ({
  requireRole:
    (..._allowed: Array<"owner" | "partner" | "crew" | "client">) =>
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = {
        id: "u1",
        role: "owner",
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

describe("GET /api/admin/email-previews (list)", () => {
  let app: Express;

  beforeEach(() => {
    app = buildApp();
  });

  it("returns the list of templates with field schemas", async () => {
    const res = await request(app).get("/api/admin/email-previews");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.length).toBeGreaterThan(0);

    for (const tpl of res.body.templates) {
      expect(typeof tpl.id).toBe("string");
      expect(typeof tpl.label).toBe("string");
      expect(typeof tpl.description).toBe("string");
      expect(Array.isArray(tpl.fields)).toBe(true);
      expect(tpl.fields.length).toBeGreaterThan(0);
      for (const f of tpl.fields) {
        expect(typeof f.key).toBe("string");
        expect(typeof f.label).toBe("string");
        expect(["text", "textarea", "boolean"]).toContain(f.type);
        expect(f).toHaveProperty("default");
      }
    }

    const ids = res.body.templates.map((t: { id: string }) => t.id);
    expect(ids).toContain("review-ready");
    expect(ids).toContain("new-comment");
    expect(ids).toContain("comment-resolved-with-note");
  });

  it("includes the expected fields for the review-ready template", async () => {
    const res = await request(app).get("/api/admin/email-previews");
    const reviewReady = res.body.templates.find(
      (t: { id: string }) => t.id === "review-ready",
    );
    expect(reviewReady).toBeDefined();
    const keys = reviewReady.fields.map((f: { key: string }) => f.key);
    expect(keys).toEqual([
      "recipientName",
      "projectName",
      "deliverableTitle",
      "link",
    ]);
  });
});

describe("GET /api/admin/email-previews/:id", () => {
  let app: Express;

  beforeEach(() => {
    app = buildApp();
  });

  it("returns JSON with rendered html and field schema by default", async () => {
    const res = await request(app).get(
      "/api/admin/email-previews/review-ready",
    );

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("review-ready");
    expect(Array.isArray(res.body.fields)).toBe(true);
    expect(typeof res.body.html).toBe("string");
    expect(res.body.html).toContain("Alex Morgan");
    expect(res.body.html).toContain("Bering Sea Crabbers");
  });

  it("renders custom values supplied via query string", async () => {
    const res = await request(app)
      .get("/api/admin/email-previews/review-ready")
      .query({
        recipientName: "Riley Tester",
        projectName: "Custom Project Title",
        deliverableTitle: "Custom Deliverable",
        link: "https://example.test/custom-link",
      });

    expect(res.status).toBe(200);
    expect(res.body.html).toContain("Riley Tester");
    expect(res.body.html).toContain("Custom Project Title");
    expect(res.body.html).toContain("Custom Deliverable");
    expect(res.body.html).toContain("https://example.test/custom-link");
    expect(res.body.html).not.toContain("Alex Morgan");
  });

  it("falls back to default values when fields are blank or whitespace", async () => {
    const res = await request(app)
      .get("/api/admin/email-previews/review-ready")
      .query({
        recipientName: "",
        projectName: "   ",
        deliverableTitle: "",
        link: "",
      });

    expect(res.status).toBe(200);
    expect(res.body.html).toContain("Alex Morgan");
    expect(res.body.html).toContain("Bering Sea Crabbers");
    expect(res.body.html).toContain("Hero Cut v2");
  });

  it("parses boolean fields from query strings (isReply=true switches reply copy)", async () => {
    const asReply = await request(app)
      .get("/api/admin/email-previews/new-comment")
      .query({ isReply: "true" });
    const asNew = await request(app)
      .get("/api/admin/email-previews/new-comment")
      .query({ isReply: "false" });

    expect(asReply.status).toBe(200);
    expect(asNew.status).toBe(200);
    expect(asReply.body.html).not.toBe(asNew.body.html);
  });

  it("returns 404 for an unknown template id", async () => {
    const res = await request(app).get(
      "/api/admin/email-previews/not-a-real-template",
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/unknown/i);
  });

  it("returns raw html with format=html and sets framing headers", async () => {
    const res = await request(app)
      .get("/api/admin/email-previews/review-ready")
      .query({ format: "html" });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.text).toContain("Alex Morgan");
    expect(res.text.trim().startsWith("<")).toBe(true);
  });

  it("format=html honors overridden values too", async () => {
    const res = await request(app)
      .get("/api/admin/email-previews/review-ready")
      .query({ format: "html", recipientName: "Override Name" });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Override Name");
    expect(res.text).not.toContain("Alex Morgan");
  });
});
