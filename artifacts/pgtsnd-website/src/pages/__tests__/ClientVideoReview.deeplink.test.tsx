import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

// Mock heavy / framework-coupled components so we can render the page in
// isolation without pulling in routing, layout chrome, or a real video player.
vi.mock("../../components/ClientLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("../../components/UploaderBadge", () => ({
  default: () => null,
}));
vi.mock("../../components/TeamLoadingStates", () => ({
  ClientVideoReviewSkeleton: () => <div data-testid="loading-skel" />,
  ErrorState: ({ message }: { message: string }) => <div>{message}</div>,
}));
vi.mock("../../components/VideoPlayer", () => ({
  default: () => <div data-testid="video-player" />,
  formatTime: (s: number) => `${s}s`,
}));

const { toastMock, useTeamAuthMock, panelPropsLog, apiMock } = vi.hoisted(() => {
  return {
    toastMock: vi.fn(),
    useTeamAuthMock: vi.fn(),
    panelPropsLog: [] as Array<{
      comments: { id: string; resolvedAt: string | null; authorId: string | null }[];
      highlightCommentId?: string | null;
      openReplyForCommentId?: string | null;
    }>,
    apiMock: {
      getClientDeliverables: vi.fn(),
      getVideoComments: vi.fn(),
      getDeliverableVersions: vi.fn(),
      addVideoComment: vi.fn(),
      addVideoCommentReply: vi.fn(),
      reopenVideoComment: vi.fn(),
      approveDeliverable: vi.fn(),
      requestRevision: vi.fn(),
    },
  };
});

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("../../contexts/TeamAuthContext", () => ({
  useTeamAuth: () => useTeamAuthMock(),
}));

vi.mock("../../components/VideoReviewPanel", () => ({
  default: (props: (typeof panelPropsLog)[number]) => {
    panelPropsLog.push(props);
    return <div data-testid="review-panel" />;
  },
}));

vi.mock("../../lib/api", () => ({
  api: apiMock,
}));

import ClientVideoReview from "../ClientVideoReview";

const D1 = { id: "d1", title: "First Cut", status: "in_review", fileUrl: "/a.mp4" };
const D2 = { id: "d2", title: "Second Cut", status: "in_review", fileUrl: "/b.mp4" };

function setQuery(qs: string) {
  // jsdom: rewriting search via History API
  window.history.replaceState({}, "", `/?${qs.replace(/^\?/, "")}`);
}

beforeEach(() => {
  panelPropsLog.length = 0;
  toastMock.mockReset();
  Object.values(apiMock).forEach((fn) => fn.mockReset());

  apiMock.getClientDeliverables.mockResolvedValue([D1, D2]);
  apiMock.getVideoComments.mockResolvedValue([]);
  apiMock.getDeliverableVersions.mockResolvedValue([]);
  apiMock.reopenVideoComment.mockResolvedValue({
    id: "comment-x",
    resolvedAt: null,
    resolvedBy: null,
    resolvedByName: null,
    resolvedNote: null,
  });

  useTeamAuthMock.mockReturnValue({
    currentUser: { id: "client-1" },
    allUsers: [],
    userMap: new Map(),
    isLoading: false,
    userId: "client-1",
  });
});

describe("ClientVideoReview deep-link flow", () => {
  it("auto-selects the deliverable from ?deliverableId= and propagates highlightCommentId to the panel", async () => {
    setQuery("deliverableId=d2&commentId=cmt-77&action=reply");

    render(<ClientVideoReview />);

    // Wait for deliverable + comments fetches to complete and the panel to
    // have been re-rendered with the deep-linked deliverable selected.
    await waitFor(() => {
      expect(apiMock.getVideoComments).toHaveBeenCalledWith("d2");
    });
    await waitFor(() => {
      const last = panelPropsLog[panelPropsLog.length - 1];
      expect(last?.highlightCommentId).toBe("cmt-77");
      expect(last?.openReplyForCommentId).toBe("cmt-77");
    });
  });

  it("auto-triggers reopen when ?action=reopen and the current user is the comment author", async () => {
    setQuery("deliverableId=d1&commentId=cmt-99&action=reopen");
    apiMock.getVideoComments.mockResolvedValue([
      {
        id: "cmt-99",
        deliverableId: "d1",
        deliverableVersionId: null,
        versionLabel: "v1",
        authorId: "client-1",
        authorName: "Me",
        timestampSeconds: 4,
        content: "needs polish",
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        resolvedBy: "owner",
        resolvedByName: "Owner",
        resolvedNote: null,
        replies: [],
      },
    ]);

    render(<ClientVideoReview />);

    await waitFor(() => {
      expect(apiMock.reopenVideoComment).toHaveBeenCalledWith("cmt-99");
    });
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith("Comment reopened", "success");
    });
  });

  it("does NOT auto-trigger reopen when the current user is not the comment author and surfaces an error toast instead", async () => {
    setQuery("deliverableId=d1&commentId=cmt-other&action=reopen");
    apiMock.getVideoComments.mockResolvedValue([
      {
        id: "cmt-other",
        deliverableId: "d1",
        deliverableVersionId: null,
        versionLabel: "v1",
        authorId: "someone-else",
        authorName: "Someone Else",
        timestampSeconds: 4,
        content: "needs polish",
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        resolvedBy: "owner",
        resolvedByName: "Owner",
        resolvedNote: null,
        replies: [],
      },
    ]);

    render(<ClientVideoReview />);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        "Only the original author can reopen this comment",
        "error",
      );
    });
    expect(apiMock.reopenVideoComment).not.toHaveBeenCalled();
  });

  it("with no action= param, does not auto-reopen and does not auto-open the reply composer", async () => {
    setQuery("deliverableId=d1&commentId=cmt-passive");
    apiMock.getVideoComments.mockResolvedValue([
      {
        id: "cmt-passive",
        deliverableId: "d1",
        deliverableVersionId: null,
        versionLabel: "v1",
        authorId: "client-1",
        authorName: "Me",
        timestampSeconds: 4,
        content: "x",
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        resolvedByName: null,
        resolvedNote: null,
        replies: [],
      },
    ]);

    render(<ClientVideoReview />);

    await waitFor(() => {
      expect(apiMock.getVideoComments).toHaveBeenCalledWith("d1");
    });
    await waitFor(() => {
      const last = panelPropsLog[panelPropsLog.length - 1];
      expect(last?.highlightCommentId).toBe("cmt-passive");
      expect(last?.openReplyForCommentId).toBeNull();
    });
    expect(apiMock.reopenVideoComment).not.toHaveBeenCalled();
  });
});
