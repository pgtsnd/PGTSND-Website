import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DormantTokensSubscribersCard } from "../../pages/TeamSettings";

const stubTheme = {
  cardBackground: "#111",
  bgCard: "#181818",
  background: "#000",
  borderLight: "#333",
  border: "#333",
  textPrimary: "#fff",
  textSecondary: "#aaa",
  text: "#fff",
  textMuted: "#888",
  accent: "#3fbf6f",
  accentText: "#000",
  activeNav: "#222",
};
const f = (s: object) => s;

function makeOwner(over: Partial<{
  id: string; name: string | null; email: string;
  emailNotifyDormantTokens: boolean;
  snoozeUntil: string | null; unsubscribedAt: string | null;
  status: "subscribed" | "snoozed" | "unsubscribed";
}> = {}) {
  return {
    id: "o1",
    name: "Avery Owner",
    email: "avery@example.com",
    emailNotifyDormantTokens: true,
    snoozeUntil: null,
    unsubscribedAt: null,
    status: "subscribed" as const,
    ...over,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  // @ts-expect-error - jsdom global
  global.fetch = fetchMock;
});

afterEach(() => {
  // @ts-expect-error - jsdom global
  delete global.fetch;
});

function renderCard() {
  return render(<DormantTokensSubscribersCard t={stubTheme} f={f} />);
}

describe("DormantTokensSubscribersCard", () => {
  it("renders one row per owner with the correct status label and color", async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        owners: [
          makeOwner({ id: "o-sub", name: "Subby", email: "s@x.com", status: "subscribed" }),
          makeOwner({
            id: "o-snooze",
            name: "Snoozey",
            email: "z@x.com",
            status: "snoozed",
            snoozeUntil: future,
          }),
          makeOwner({
            id: "o-unsub",
            name: "Unsubby",
            email: "u@x.com",
            status: "unsubscribed",
            emailNotifyDormantTokens: false,
            unsubscribedAt: "2025-04-01T12:00:00Z",
          }),
        ],
      }),
    });

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("dormant-tokens-subscriber-row-o-sub")).toBeInTheDocument();
    });

    expect(screen.getByTestId("dormant-tokens-subscriber-status-o-sub")).toHaveTextContent(
      /subscribed/i,
    );
    expect(screen.getByTestId("dormant-tokens-subscriber-status-o-snooze")).toHaveTextContent(
      /snoozed/i,
    );
    expect(screen.getByTestId("dormant-tokens-subscriber-status-o-unsub")).toHaveTextContent(
      /unsubscribed/i,
    );

    // Summary line shows accurate counts.
    expect(
      screen.getByText(/1 subscribed · 1 snoozed · 1 unsubscribed/i),
    ).toBeInTheDocument();

    // Email + name shown for each.
    expect(screen.getByText("Subby")).toBeInTheDocument();
    expect(screen.getByText("s@x.com")).toBeInTheDocument();
    expect(screen.getByText("Unsubby")).toBeInTheDocument();
  });

  it("hits the admin endpoint with credentials", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ owners: [] }) });
    renderCard();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/dormant-tokens-subscribers",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("renders the empty state when no owners are returned", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ owners: [] }) });
    renderCard();
    await waitFor(() => {
      expect(screen.getByText(/no owner accounts found/i)).toBeInTheDocument();
    });
  });

  it("shows an error message when the request fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    renderCard();
    await waitFor(() => {
      expect(screen.getByText(/Request failed \(403\)/i)).toBeInTheDocument();
    });
  });

  it("re-fetches when Refresh is clicked", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ owners: [] }) });
    renderCard();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByTestId("dormant-tokens-subscribers-refresh"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
