/// <reference types="vitest/globals" />
import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@workspace/api-client-react", () => ({
  useUpdateDeliverable: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../src/lib/csrf", () => ({
  csrfHeaders: () => ({}),
}));

vi.mock("../src/lib/api", () => ({
  api: {
    getDeliverableVersions: vi.fn().mockResolvedValue([]),
    getVideoComments: vi.fn().mockResolvedValue([]),
    getReviewLinks: vi.fn().mockResolvedValue([]),
    addVideoComment: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../src/components/VideoPlayer", () => ({
  __esModule: true,
  default: (props: { src?: string }) => (
    <div data-testid="mock-video-player" data-src={props.src ?? ""} />
  ),
}));

vi.mock("../src/components/VideoReviewPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-review-panel" />,
}));

vi.mock("../src/components/UploaderBadge", () => ({
  __esModule: true,
  default: () => null,
}));

import { DeliverablesTab, TeamReviewTab } from "../src/pages/TeamProjectDetail";
import type { Deliverable } from "../src/hooks/useTeamData";

const baseDeliverable = {
  description: null,
  fileSize: null,
  uploadedBy: null,
  taskId: null,
  submittedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeVideoDeliverable(overrides: Partial<Deliverable>): Deliverable {
  return {
    ...baseDeliverable,
    type: "video",
    status: "in_review",
    version: "v1",
    ...overrides,
  } as Deliverable;
}

const projectId = "proj-test-1";
const heroId = "del-hero-1";
const btsId = "del-bts-1";
const heroUrl = "https://example.com/hero.mp4";
const btsUrl = "https://example.com/bts.mp4";

const deliverables: Deliverable[] = [
  makeVideoDeliverable({
    id: heroId,
    projectId,
    title: "Hero Cut v1",
    fileUrl: heroUrl,
  }),
  makeVideoDeliverable({
    id: btsId,
    projectId,
    title: "Behind The Scenes v1",
    fileUrl: btsUrl,
  }),
];

function ProjectShell() {
  const [activeTab, setActiveTab] = useState<"deliverables" | "review">(
    "deliverables",
  );
  const [reviewDeliverableId, setReviewDeliverableId] = useState<string | null>(
    null,
  );

  return (
    <div>
      <div>
        <button
          data-testid="tab-deliverables"
          aria-pressed={activeTab === "deliverables"}
          onClick={() => setActiveTab("deliverables")}
        >
          Deliverables
        </button>
        <button
          data-testid="tab-review"
          aria-pressed={activeTab === "review"}
          onClick={() => setActiveTab("review")}
        >
          Review
        </button>
      </div>

      {activeTab === "deliverables" && (
        <DeliverablesTab
          deliverables={deliverables}
          onRefresh={() => {}}
          onOpenReview={(id) => {
            setReviewDeliverableId(id);
            setActiveTab("review");
          }}
        />
      )}

      {activeTab === "review" && (
        <TeamReviewTab
          deliverables={deliverables}
          projectId={projectId}
          deliverableId={reviewDeliverableId}
          onSelectDeliverable={(id) => setReviewDeliverableId(id)}
        />
      )}
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe("Deliverables tab → Review tab navigation", () => {
  it("clicking a video deliverable's preview thumbnail switches to the Review tab and loads that deliverable in the player", async () => {
    render(<ProjectShell />);

    // Sanity: we start on Deliverables, both cards rendered, both thumbnails present.
    expect(screen.getByTestId("tab-deliverables")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("tab-review")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText("Hero Cut v1")).toBeInTheDocument();
    expect(screen.getByText("Behind The Scenes v1")).toBeInTheDocument();
    expect(screen.getByTestId(`deliverable-preview-${heroId}`)).toBeInTheDocument();
    const btsThumb = screen.getByTestId(`deliverable-preview-${btsId}`);
    expect(btsThumb).toBeInTheDocument();

    // Click the BTS thumbnail.
    fireEvent.click(btsThumb);

    // Review tab is now active and Deliverables tab is no longer active.
    expect(screen.getByTestId("tab-review")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("tab-deliverables")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // The DeliverablesTab is unmounted; the Review panel is mounted with the
    // matching deliverable selected, and the player is loaded with that file URL.
    expect(
      screen.queryByTestId(`deliverable-preview-${btsId}`),
    ).not.toBeInTheDocument();

    // TeamReviewTab uses initialDeliverableId asynchronously via useEffect; flush.
    await Promise.resolve();
    await Promise.resolve();

    const player = await screen.findByTestId("mock-video-player");
    expect(player).toBeInTheDocument();
    expect(player.getAttribute("data-src")).toBe(btsUrl);
  });

  it("clicking elsewhere on a deliverable card (not the thumbnail) expands/collapses the card and does NOT switch to the Review tab", () => {
    render(<ProjectShell />);

    expect(screen.getByTestId("tab-deliverables")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Card body for Hero is collapsed initially: upload zone is not in the DOM.
    expect(
      screen.queryByTestId(`deliverable-upload-zone-${heroId}`),
    ).not.toBeInTheDocument();

    // Click the title text (part of the row, NOT the thumbnail).
    fireEvent.click(screen.getByText("Hero Cut v1"));

    // Still on Deliverables tab.
    expect(screen.getByTestId("tab-deliverables")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("tab-review")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Card is now expanded — upload zone appears.
    expect(
      screen.getByTestId(`deliverable-upload-zone-${heroId}`),
    ).toBeInTheDocument();

    // Click the title text again to collapse.
    fireEvent.click(screen.getByText("Hero Cut v1"));

    expect(screen.getByTestId("tab-deliverables")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByTestId(`deliverable-upload-zone-${heroId}`),
    ).not.toBeInTheDocument();
  });
});
