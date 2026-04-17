import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import VideoReviewPanel, {
  type VideoComment,
} from "../VideoReviewPanel";

function makeComment(overrides: Partial<VideoComment> = {}): VideoComment {
  return {
    id: "c1",
    deliverableId: "d1",
    deliverableVersionId: null,
    versionLabel: "v1",
    authorId: "u1",
    authorName: "Author",
    timestampSeconds: 5,
    content: "needs polish",
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    resolvedAt: null,
    resolvedBy: null,
    resolvedByName: null,
    resolvedNote: null,
    replies: [],
    ...overrides,
  };
}

function noop() {
  return Promise.resolve();
}

describe("VideoReviewPanel deep-link behavior", () => {
  it("scrolls the highlighted comment into view on mount", async () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy as never;

    const target = makeComment({ id: "target", content: "highlight me" });
    const other = makeComment({ id: "other", content: "ignore me" });

    render(
      <VideoReviewPanel
        comments={[other, target]}
        onAddComment={noop}
        onAddReply={noop}
        onCommentClick={() => {}}
        activeTimestamp={null}
        highlightCommentId="target"
      />,
    );

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled();
    });
    expect(scrollSpy.mock.calls[0][0]).toEqual({
      behavior: "smooth",
      block: "center",
    });
  });

  it("expands the resolved-summary so a highlighted resolved comment becomes visible", async () => {
    Element.prototype.scrollIntoView = vi.fn() as never;

    const resolved = makeComment({
      id: "resolved-c",
      content: "resolved feedback",
      resolvedAt: new Date("2026-02-01").toISOString(),
      resolvedBy: "owner",
      resolvedByName: "Owner",
    });

    render(
      <VideoReviewPanel
        comments={[resolved]}
        onAddComment={noop}
        onAddReply={noop}
        onCommentClick={() => {}}
        activeTimestamp={null}
        highlightCommentId="resolved-c"
      />,
    );

    await waitFor(() => {
      // Highlighting a resolved comment expands the resolved-summary section,
      // so the comment body now appears both in the main list and in the
      // expanded summary (>= 1 occurrence is enough).
      expect(screen.getAllByText("resolved feedback").length).toBeGreaterThan(0);
    });
  });

  it("opens the reply composer for the comment specified by openReplyForCommentId", async () => {
    Element.prototype.scrollIntoView = vi.fn() as never;

    const c = makeComment({ id: "reply-target", content: "thread starter" });

    render(
      <VideoReviewPanel
        comments={[c]}
        onAddComment={noop}
        onAddReply={noop}
        onCommentClick={() => {}}
        activeTimestamp={null}
        openReplyForCommentId="reply-target"
      />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Reply...")).toBeInTheDocument();
    });
  });

  it("renders the Reopened badge and history block when reopened audit fields are present", async () => {
    Element.prototype.scrollIntoView = vi.fn() as never;

    const reopened = makeComment({
      id: "reopened-c",
      content: "needs another look",
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      resolvedNote: null,
      reopenedAt: new Date("2026-03-10T12:00:00Z").toISOString(),
      reopenedBy: "u-partner",
      reopenedByName: "Pat Partner",
      previousResolvedAt: new Date("2026-03-01T08:00:00Z").toISOString(),
      previousResolvedByName: "Olivia Owner",
      previousResolvedNote: "looked good on first pass",
    });

    render(
      <VideoReviewPanel
        comments={[reopened]}
        onAddComment={noop}
        onAddReply={noop}
        onCommentClick={() => {}}
        activeTimestamp={null}
      />,
    );

    // The "Reopened" badge appears on the comment header.
    const badge = await screen.findByTestId("reopened-badge-reopened-c");
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toMatch(/Reopened/);
    expect(badge.getAttribute("title")).toMatch(/Pat Partner/);

    // The history block appears below the comment with the actor name and the
    // prior-resolution snapshot details (who resolved it and the prior note).
    const history = screen.getByTestId("reopened-activity-reopened-c");
    expect(history).toBeInTheDocument();
    expect(history.textContent).toMatch(/Reopened by Pat Partner/);
    expect(history.textContent).toMatch(/Was previously resolved by Olivia Owner/);
    expect(history.textContent).toMatch(/looked good on first pass/);
  });

  it("does not render the Reopened badge or history block when audit fields are absent", async () => {
    Element.prototype.scrollIntoView = vi.fn() as never;

    const fresh = makeComment({ id: "fresh-c", content: "first feedback" });

    render(
      <VideoReviewPanel
        comments={[fresh]}
        onAddComment={noop}
        onAddReply={noop}
        onCommentClick={() => {}}
        activeTimestamp={null}
      />,
    );

    expect(screen.queryByTestId("reopened-badge-fresh-c")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reopened-activity-fresh-c")).not.toBeInTheDocument();
  });

  it("does not render the Reopened badge while the comment is currently resolved (only after re-opening)", async () => {
    Element.prototype.scrollIntoView = vi.fn() as never;

    const stillResolved = makeComment({
      id: "still-resolved-c",
      content: "resolved item",
      resolvedAt: new Date("2026-03-15T00:00:00Z").toISOString(),
      resolvedBy: "u-owner",
      resolvedByName: "Olivia Owner",
      reopenedAt: new Date("2026-03-10T00:00:00Z").toISOString(),
      reopenedBy: "u-partner",
      reopenedByName: "Pat Partner",
    });

    render(
      <VideoReviewPanel
        comments={[stillResolved]}
        onAddComment={noop}
        onAddReply={noop}
        onCommentClick={() => {}}
        activeTimestamp={null}
      />,
    );

    expect(
      screen.queryByTestId("reopened-badge-still-resolved-c"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("reopened-activity-still-resolved-c"),
    ).not.toBeInTheDocument();
  });

  it("does NOT open the reply composer when openReplyForCommentId is null", async () => {
    Element.prototype.scrollIntoView = vi.fn() as never;

    const c = makeComment({ id: "reply-target", content: "thread starter" });

    render(
      <VideoReviewPanel
        comments={[c]}
        onAddComment={noop}
        onAddReply={noop}
        onCommentClick={() => {}}
        activeTimestamp={null}
      />,
    );

    expect(screen.queryByPlaceholderText("Reply...")).not.toBeInTheDocument();
  });
});
