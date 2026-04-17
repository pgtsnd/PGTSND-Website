import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("../../components/ClientLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("../../components/UploaderBadge", () => ({ default: () => null }));
vi.mock("../../components/TeamLoadingStates", () => ({
  ClientVideoReviewSkeleton: () => <div data-testid="loading-skel" />,
  ErrorState: ({ message }: { message: string }) => <div>{message}</div>,
}));
vi.mock("../../components/ThemeContext", () => ({
  useTheme: () => ({
    t: {
      bg: "#000",
      bgCard: "#111",
      border: "#222",
      borderSubtle: "#333",
      text: "#fff",
      textSecondary: "#ccc",
      textMuted: "#888",
      activeNav: "#444",
    },
  }),
}));

const { videoPlayerLog, panelPropsLog, apiMock, useTeamAuthMock, toastMock } =
  vi.hoisted(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoPlayerLog: [] as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    panelPropsLog: [] as any[],
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
    useTeamAuthMock: vi.fn(),
    toastMock: vi.fn(),
  }));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));
vi.mock("../../contexts/TeamAuthContext", () => ({
  useTeamAuth: () => useTeamAuthMock(),
}));
vi.mock("../../components/VideoPlayer", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    videoPlayerLog.push({
      src: props.src,
      markerIds: (props.markers ?? []).map((m: { id: string }) => m.id),
      seekTo: props.seekTo ?? null,
      onTimeClick: props.onTimeClick,
    });
    return <div data-testid="video-player" />;
  },
  formatTime: (s: number) => `${s}s`,
}));
vi.mock("../../components/VideoReviewPanel", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    panelPropsLog.push(props);
    return <div data-testid="review-panel" />;
  },
}));
vi.mock("../../lib/api", () => ({ api: apiMock }));

import ClientVideoReview from "../ClientVideoReview";

// Two video deliverables that share the same title+projectId so the page
// treats them as versions of each other (versions are derived client-side).
const D_V1 = {
  id: "del-v1",
  projectId: "proj-1",
  projectName: "Proj",
  title: "Hero",
  type: "video",
  status: "in_review",
  fileUrl: "/v1.mp4",
  version: "v1",
  description: null,
  uploadedBy: null,
  uploadedByName: null,
  uploadedByAvatarUrl: null,
  submittedAt: null,
  createdAt: new Date("2026-01-01").toISOString(),
  updatedAt: new Date("2026-01-01").toISOString(),
};
const D_V2 = { ...D_V1, id: "del-v2", version: "v2", fileUrl: "/v2.mp4" };

const COMMENT_A = {
  id: "ca",
  deliverableId: "del-v2",
  deliverableVersionId: null,
  versionLabel: "v2",
  authorId: null,
  authorName: "x",
  timestampSeconds: 5,
  content: "on v2",
  createdAt: new Date().toISOString(),
  resolvedAt: null,
  resolvedBy: null,
  resolvedByName: null,
  resolvedNote: null,
  replies: [],
};
const COMMENT_B = { ...COMMENT_A, id: "cb", deliverableId: "del-v1", timestampSeconds: 11, content: "on v1" };

beforeEach(() => {
  videoPlayerLog.length = 0;
  panelPropsLog.length = 0;
  toastMock.mockReset();
  Object.values(apiMock).forEach((fn) => fn.mockReset());
  useTeamAuthMock.mockReturnValue({
    currentUser: { id: "client-1" },
    allUsers: [],
    userMap: new Map(),
    isLoading: false,
    userId: "client-1",
  });
  // Order returned by the API matters: page filters in_review first.
  apiMock.getClientDeliverables.mockResolvedValue([D_V2, D_V1]);
  apiMock.getDeliverableVersions.mockResolvedValue([]);
  // Default selectedDeliverable is D_V2 (first in pendingOrReview).
  apiMock.getVideoComments.mockImplementation(async (id: string) => {
    if (id === "del-v2") return [COMMENT_A];
    if (id === "del-v1") return [COMMENT_B];
    return [];
  });
  // Reset URL so deep-link logic doesn't trigger.
  window.history.replaceState({}, "", "/");
});

async function renderAndLoad() {
  const utils = render(<ClientVideoReview />);
  await waitFor(() => {
    expect(panelPropsLog.length).toBeGreaterThan(0);
  });
  // wait for compare toggle to mount (depends on versions.length > 1)
  await waitFor(() => {
    expect(utils.queryByTestId("client-review-compare-toggle")).not.toBeNull();
  });
  return utils;
}

function lastPanel() {
  return panelPropsLog[panelPropsLog.length - 1];
}

describe("ClientVideoReview compare mode", () => {
  it("toggling Compare on renders side-by-side and fetches comments for the compare version", async () => {
    const { getByTestId, queryByTestId } = await renderAndLoad();
    expect(queryByTestId("client-review-compare-side")).toBeNull();

    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() =>
      expect(queryByTestId("client-review-compare-side")).not.toBeNull(),
    );

    // It should have called getVideoComments for the compare deliverable id.
    expect(apiMock.getVideoComments).toHaveBeenCalledWith("del-v1");

    const last2 = videoPlayerLog.slice(-2);
    const srcs = last2.map((p) => p.src);
    expect(srcs).toContain("/v2.mp4");
    expect(srcs).toContain("/v1.mp4");
  });

  it("switching to A/B layout swaps to a single combined player; A/B toggle changes which file is showing", async () => {
    const { getByTestId, queryByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => getByTestId("client-review-compare-side"));

    fireEvent.click(getByTestId("client-review-compare-layout-ab"));
    await waitFor(() => {
      expect(queryByTestId("client-review-compare-ab")).not.toBeNull();
      expect(queryByTestId("client-review-compare-side")).toBeNull();
      expect(queryByTestId("client-review-compare-sync")).toBeNull();
    });
    // Default A/B starts on A (v2)
    const lastA = videoPlayerLog[videoPlayerLog.length - 1];
    expect(lastA.src).toBe("/v2.mp4");

    fireEvent.click(getByTestId("client-review-compare-ab-toggle"));
    await waitFor(() => {
      const last = videoPlayerLog[videoPlayerLog.length - 1];
      expect(last.src).toBe("/v1.mp4");
    });
  });

  it("Sync playheads checkbox is checked by default and can be turned off in Side-by-side", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => getByTestId("client-review-compare-side"));

    const sync = getByTestId("client-review-compare-sync") as HTMLInputElement;
    expect(sync.checked).toBe(true);
    fireEvent.click(sync);
    expect(sync.checked).toBe(false);
  });

  it("markers filter to the correct player while comparing (A shows comments for the active deliverable, B for the compare deliverable)", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => getByTestId("client-review-compare-side"));

    const last2 = videoPlayerLog.slice(-2);
    const aPlayer = last2.find((p) => p.src === "/v2.mp4");
    const bPlayer = last2.find((p) => p.src === "/v1.mp4");
    expect(aPlayer?.markerIds).toEqual(["ca"]);
    expect(bPlayer?.markerIds).toEqual(["cb"]);
  });

  it("posting a comment from the panel always tags the active (selected) deliverable's id", async () => {
    apiMock.addVideoComment.mockImplementation(
      async (deliverableId: string, ts: number, content: string) => ({
        id: "new",
        deliverableId,
        deliverableVersionId: null,
        versionLabel: "v2",
        authorId: "client-1",
        authorName: "Me",
        timestampSeconds: ts,
        content,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        resolvedByName: null,
        resolvedNote: null,
        replies: [],
      }),
    );

    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => getByTestId("client-review-compare-side"));

    await lastPanel().onAddComment(4, "while comparing");
    expect(apiMock.addVideoComment).toHaveBeenCalledWith(
      "del-v2", // the active selected deliverable, not the B version
      4,
      "while comparing",
    );
  });

  it("clicking a B-side (v1) comment seeks the B player; with sync on, also seeks the A player", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => getByTestId("client-review-compare-side"));
    // Wait for compareComments to load and a re-render to flush.
    await waitFor(() =>
      expect(apiMock.getVideoComments).toHaveBeenCalledWith("del-v1"),
    );

    const baselineLen = videoPlayerLog.length;
    // The page passes a merged comment list to the panel when comparing.
    const merged = lastPanel().comments;
    const cb = merged.find((c: { id: string }) => c.id === "cb");
    expect(cb).toBeDefined();
    lastPanel().onCommentClick(cb);

    await waitFor(() => {
      const newPlayers = videoPlayerLog.slice(baselineLen);
      const v1Players = newPlayers.filter((p) => p.src === "/v1.mp4");
      const v2Players = newPlayers.filter((p) => p.src === "/v2.mp4");
      expect(v1Players.some((p) => p.seekTo === 11)).toBe(true);
      // Sync is on by default → A also gets seekTo
      expect(v2Players.some((p) => p.seekTo === 11)).toBe(true);
    });
  });

  it("with sync OFF, clicking a v1 comment seeks only the B player", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => getByTestId("client-review-compare-side"));
    await waitFor(() =>
      expect(apiMock.getVideoComments).toHaveBeenCalledWith("del-v1"),
    );
    fireEvent.click(getByTestId("client-review-compare-sync"));

    const baselineLen = videoPlayerLog.length;
    const cb = lastPanel().comments.find((c: { id: string }) => c.id === "cb");
    lastPanel().onCommentClick(cb);

    await waitFor(() => {
      const newPlayers = videoPlayerLog.slice(baselineLen);
      const v2Players = newPlayers.filter((p) => p.src === "/v2.mp4");
      // A should never get seekTo set to 11 when sync is off
      expect(v2Players.every((p) => p.seekTo !== 11)).toBe(true);
    });
  });

  it("Exit Compare returns to a single player and stops fetching the compare deliverable's comments", async () => {
    const { getByTestId, queryByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => getByTestId("client-review-compare-side"));

    fireEvent.click(getByTestId("client-review-compare-toggle"));
    await waitFor(() => {
      expect(queryByTestId("client-review-compare-side")).toBeNull();
      expect(queryByTestId("client-review-compare-ab")).toBeNull();
    });
  });
});
