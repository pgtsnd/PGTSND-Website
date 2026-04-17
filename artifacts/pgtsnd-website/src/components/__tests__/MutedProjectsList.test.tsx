import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getProjectMutes = vi.fn();
const unmuteProject = vi.fn();
const unmuteProjects = vi.fn();

vi.mock("../../lib/api", () => ({
  api: {
    getProjectMutes: (...args: unknown[]) => getProjectMutes(...args),
    unmuteProject: (...args: unknown[]) => unmuteProject(...args),
    unmuteProjects: (...args: unknown[]) => unmuteProjects(...args),
  },
}));

import MutedProjectsList from "../MutedProjectsList";
import { ThemeProvider } from "../ThemeContext";

beforeEach(() => {
  getProjectMutes.mockReset();
  unmuteProject.mockReset();
  unmuteProjects.mockReset();
});

function renderList() {
  return render(
    <ThemeProvider>
      <MutedProjectsList />
    </ThemeProvider>,
  );
}

describe("MutedProjectsList — archived muted projects", () => {
  it("shows the real project name and an Archived badge instead of 'Unknown project'", async () => {
    getProjectMutes.mockResolvedValue({
      projectIds: ["p-archived"],
      mutes: [
        { id: "p-archived", name: "Skyline Launch Reel", status: "archived" },
      ],
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByText("Skyline Launch Reel")).toBeInTheDocument();
    });

    // The archived status badge appears.
    expect(
      screen.getByTestId("muted-project-status-p-archived"),
    ).toHaveTextContent(/archived/i);

    // We never fall back to the placeholder name.
    expect(screen.queryByText("Unknown project")).not.toBeInTheDocument();
  });

  it("renders the badge only for archived/delivered projects, not active ones", async () => {
    getProjectMutes.mockResolvedValue({
      projectIds: ["p-active", "p-archived"],
      mutes: [
        { id: "p-active", name: "Active Promo", status: "active" },
        { id: "p-archived", name: "Old Reel", status: "archived" },
      ],
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByText("Old Reel")).toBeInTheDocument();
    });

    expect(screen.getByText("Active Promo")).toBeInTheDocument();
    expect(
      screen.getByTestId("muted-project-status-p-archived"),
    ).toHaveTextContent(/archived/i);
    expect(
      screen.queryByTestId("muted-project-status-p-active"),
    ).not.toBeInTheDocument();
  });

  it("falls back to 'Unknown project' only when the API returns a null name", async () => {
    // Sanity check on the regression boundary: the fix relies on the API
    // sending the real name. If the name ever comes back null (the prior
    // bug), the UI shows the fallback — this test guards against the fix
    // being silently undone.
    getProjectMutes.mockResolvedValue({
      projectIds: ["p-missing"],
      mutes: [{ id: "p-missing", name: null, status: null }],
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByText("Unknown project")).toBeInTheDocument();
    });
  });
});
