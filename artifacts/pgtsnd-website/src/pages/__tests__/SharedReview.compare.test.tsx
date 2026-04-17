import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";

vi.mock("../../components/UploaderBadge", () => ({
  default: () => null,
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

interface PlayerCall {
  src: string;
  markerIds: string[];
  seekTo: number | null;
  onTimeClick?: (s: number) => void;
}

const { videoPlayerLog, panelPropsLog, apiMock, useRouteMock } = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  videoPlayerLog: [] as any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  panelPropsLog: [] as any[],
  apiMock: {
    getPublicReview: vi.fn(),
    addPublicComment: vi.fn(),
    addPublicCommentReply: vi.fn(),
  },
  useRouteMock: vi.fn(),
}));

vi.mock("wouter", () => ({
  useRoute: () => useRouteMock(),
}));

vi.mock("../../components/VideoPlayer", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    videoPlayerLog.push({
      src: props.src,
      markerIds: (props.markers ?? []).map((m: { id: string }) => m.id),
      seekTo: props.seekTo ?? null,
      onTimeClick: props.onTimeClick,
    } as PlayerCall);
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

vi.mock("../../lib/api", () => ({
  api: apiMock,
}));

import SharedReview from "../SharedReview";

const TOKEN = "tok-abc";

const baseReview = () => ({
  deliverable: {
    id: "d1",
    projectId: "p1",
    projectName: "Project One",
    title: "Hero Cut",
    type: "video",
    status: "in_review",
    fileUrl: "/api/storage/objects/v2.mp4",
    version: "v2",
    description: null,
    uploadedBy: null,
    uploadedByName: null,
    uploadedByAvatarUrl: null,
    submittedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  versions: [
    {
      id: "ver-2",
      deliverableId: "d1",
      version: "v2",
      fileUrl: "/api/storage/objects/v2.mp4",
      uploadedById: null,
      createdAt: new Date("2026-02-01").toISOString(),
    },
    {
      id: "ver-1",
      deliverableId: "d1",
      version: "v1",
      fileUrl: "/api/storage/objects/v1.mp4",
      uploadedById: null,
      createdAt: new Date("2026-01-01").toISOString(),
    },
  ],
  comments: [
    {
      id: "c-v2",
      deliverableId: "d1",
      deliverableVersionId: "ver-2",
      versionLabel: "v2",
      authorId: null,
      authorName: "Bob",
      timestampSeconds: 5,
      content: "on v2",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      resolvedNote: null,
      replies: [],
    },
    {
      id: "c-v1",
      deliverableId: "d1",
      deliverableVersionId: "ver-1",
      versionLabel: "v1",
      authorId: null,
      authorName: "Bob",
      timestampSeconds: 9,
      content: "on v1",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      resolvedNote: null,
      replies: [],
    },
  ],
});

beforeEach(() => {
  videoPlayerLog.length = 0;
  panelPropsLog.length = 0;
  Object.values(apiMock).forEach((fn) => fn.mockReset());
  useRouteMock.mockReturnValue([true, { token: TOKEN }]);
  apiMock.getPublicReview.mockResolvedValue(baseReview());
});

async function renderAndLoad() {
  const utils = render(<SharedReview />);
  await waitFor(() => {
    expect(panelPropsLog.length).toBeGreaterThan(0);
  });
  return utils;
}

function lastPanel() {
  return panelPropsLog[panelPropsLog.length - 1];
}

describe("SharedReview compare mode", () => {
  it("toggling Compare on shows compare controls and renders two side-by-side players for v2 + v1", async () => {
    const { getByTestId, queryByTestId } = await renderAndLoad();
    expect(queryByTestId("shared-review-compare-controls")).toBeNull();

    fireEvent.click(getByTestId("shared-review-compare-toggle"));

    await waitFor(() => {
      expect(queryByTestId("shared-review-compare-controls")).not.toBeNull();
      expect(queryByTestId("shared-review-compare-side")).not.toBeNull();
    });

    const last2 = videoPlayerLog.slice(-2);
    const srcs = last2.map((p) => p.src);
    expect(srcs.some((s: string) => s.startsWith("/api/storage/objects/v2.mp4"))).toBe(true);
    expect(srcs.some((s: string) => s.startsWith("/api/storage/objects/v1.mp4"))).toBe(true);
  });

  it("switching to A/B layout renders a single combined player and hides the sync checkbox; toggling A/B swaps the source", async () => {
    const { getByTestId, queryByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));

    fireEvent.click(getByTestId("shared-review-compare-layout-ab"));
    await waitFor(() => {
      expect(queryByTestId("shared-review-compare-ab")).not.toBeNull();
      expect(queryByTestId("shared-review-compare-side")).toBeNull();
      expect(queryByTestId("shared-review-compare-sync")).toBeNull();
    });
    // After switching to A/B, the most recent player should be the active (v2)
    const lastA = videoPlayerLog[videoPlayerLog.length - 1];
    expect(lastA.src.startsWith("/api/storage/objects/v2.mp4")).toBe(true);

    fireEvent.click(getByTestId("shared-review-compare-ab-toggle"));
    await waitFor(() => {
      const last = videoPlayerLog[videoPlayerLog.length - 1];
      expect(last.src.startsWith("/api/storage/objects/v1.mp4")).toBe(true);
    });
  });

  it("Sync playheads checkbox is checked by default and can be turned off in Side-by-side", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));

    const sync = getByTestId("shared-review-compare-sync") as HTMLInputElement;
    expect(sync.checked).toBe(true);
    fireEvent.click(sync);
    expect(sync.checked).toBe(false);
  });

  it("markers filter to the correct player while comparing (v2 markers on A, v1 markers on B)", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));

    const last2 = videoPlayerLog.slice(-2);
    const aPlayer = last2.find((p) => p.src.startsWith("/api/storage/objects/v2.mp4"));
    const bPlayer = last2.find((p) => p.src.startsWith("/api/storage/objects/v1.mp4"));
    expect(aPlayer?.markerIds).toEqual(["c-v2"]);
    expect(bPlayer?.markerIds).toEqual(["c-v1"]);
  });

  it("after clicking the timeline of the B player, posting a comment routes it with the compare deliverableVersionId", async () => {
    apiMock.addPublicComment.mockImplementation(
      async (
        _t: string,
        ts: number,
        content: string,
        author: string,
        versionId?: string | null,
      ) => ({
        id: "new-c",
        deliverableId: "d1",
        deliverableVersionId: versionId ?? null,
        versionLabel: versionId === "ver-1" ? "v1" : "v2",
        authorId: null,
        authorName: author,
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
    // Set author name through the panel callback
    lastPanel().onPublicAuthorNameChange?.("Alice");
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));

    // Find the B player (v1) and invoke its onTimeClick to set the active
    // version to ver-1 (the compare one).
    const last2 = videoPlayerLog.slice(-2);
    const bPlayer = last2.find((p) => p.src.startsWith("/api/storage/objects/v1.mp4"));
    expect(bPlayer?.onTimeClick).toBeTypeOf("function");
    bPlayer!.onTimeClick!(7);

    await waitFor(() => {
      // Re-render gives a fresh panel with activeTimestamp set.
      expect(lastPanel().activeTimestamp).toBe(7);
    });

    await lastPanel().onAddComment(7, "B-side comment");

    expect(apiMock.addPublicComment).toHaveBeenCalledWith(
      TOKEN,
      7,
      "B-side comment",
      "Alice",
      "ver-1",
    );
  });

  it("posting a comment after clicking the A player tags the active (latest) deliverableVersionId", async () => {
    apiMock.addPublicComment.mockImplementation(
      async (
        _t: string,
        ts: number,
        content: string,
        author: string,
        versionId?: string | null,
      ) => ({
        id: "new-c-a",
        deliverableId: "d1",
        deliverableVersionId: versionId ?? null,
        versionLabel: "v2",
        authorId: null,
        authorName: author,
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
    lastPanel().onPublicAuthorNameChange?.("Alice");
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));

    const last2 = videoPlayerLog.slice(-2);
    const aPlayer = last2.find((p) => p.src.startsWith("/api/storage/objects/v2.mp4"));
    aPlayer!.onTimeClick!(3);

    await waitFor(() => expect(lastPanel().activeTimestamp).toBe(3));
    await lastPanel().onAddComment(3, "A-side comment");

    expect(apiMock.addPublicComment).toHaveBeenCalledWith(
      TOKEN,
      3,
      "A-side comment",
      "Alice",
      "ver-2",
    );
  });

  it("clicking a v1 comment in the panel seeks the B player, and also seeks A when sync is on", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));

    const baselineLen = videoPlayerLog.length;
    const v1 = lastPanel().comments.find(
      (c: { id: string }) => c.id === "c-v1",
    );
    lastPanel().onCommentClick(v1);

    await waitFor(() => {
      const newPlayers = videoPlayerLog.slice(baselineLen);
      const v1Players = newPlayers.filter((p) =>
        p.src.startsWith("/api/storage/objects/v1.mp4"),
      );
      const v2Players = newPlayers.filter((p) =>
        p.src.startsWith("/api/storage/objects/v2.mp4"),
      );
      // B should have received a seek to 9
      expect(v1Players.some((p) => p.seekTo === 9)).toBe(true);
      // With sync ON (default), A should also receive a seek to 9
      expect(v2Players.some((p) => p.seekTo === 9)).toBe(true);
    });
  });

  it("with sync OFF, clicking a v1 comment seeks only the B player (A has no seekTo set)", async () => {
    const { getByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));
    fireEvent.click(getByTestId("shared-review-compare-sync"));

    const baselineLen = videoPlayerLog.length;
    const v1 = lastPanel().comments.find(
      (c: { id: string }) => c.id === "c-v1",
    );
    lastPanel().onCommentClick(v1);

    await waitFor(() => {
      const newPlayers = videoPlayerLog.slice(baselineLen);
      const v1Players = newPlayers.filter((p) =>
        p.src.startsWith("/api/storage/objects/v1.mp4"),
      );
      const v2Players = newPlayers.filter((p) =>
        p.src.startsWith("/api/storage/objects/v2.mp4"),
      );
      expect(v1Players.some((p) => p.seekTo === 9)).toBe(true);
      // A should never have seekTo set to 9 when sync is off
      expect(v2Players.every((p) => p.seekTo !== 9)).toBe(true);
    });
  });

  it("Exit Compare returns to a single player and hides compare controls", async () => {
    const { getByTestId, queryByTestId } = await renderAndLoad();
    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => getByTestId("shared-review-compare-side"));

    fireEvent.click(getByTestId("shared-review-compare-toggle"));
    await waitFor(() => {
      expect(queryByTestId("shared-review-compare-controls")).toBeNull();
      expect(queryByTestId("shared-review-compare-side")).toBeNull();
      expect(queryByTestId("shared-review-compare-ab")).toBeNull();
    });
  });
});
