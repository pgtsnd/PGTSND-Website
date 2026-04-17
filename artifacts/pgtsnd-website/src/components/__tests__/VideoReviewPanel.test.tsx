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
