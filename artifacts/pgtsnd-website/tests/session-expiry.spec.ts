import { test, expect } from "@playwright/test";

const DEMO_EMAIL = "demo@pgtsnd.com";
const PROTECTED_PATH = "/team/projects";
const LOGIN_PATH = "/team";
const DASHBOARD_PATH = "/team/dashboard";
const EXPIRED_MESSAGE =
  "Your session expired. Please sign in again to continue.";
const REDIRECT_KEY = "pgtsnd_post_login_redirect";
const MESSAGE_KEY = "pgtsnd_session_expired_message";
const EVENT_NAME = "pgtsnd:session-expired";

test.describe("session-expiry redirect flow", () => {
  test("dispatching pgtsnd:session-expired saves the original path and re-login returns the user there", async ({
    page,
  }) => {
    // 1. Sign in as the demo user via the team login form.
    await page.goto(LOGIN_PATH);
    await expect(
      page.getByRole("heading", { name: /crew sign in/i }),
    ).toBeVisible();
    await page.getByLabel(/email address/i).fill(DEMO_EMAIL);
    await page.getByRole("button", { name: /send magic link/i }).click();
    await page.waitForURL(
      (url) => new URL(url).pathname === DASHBOARD_PATH,
      { timeout: 15_000 },
    );

    // 2. Navigate to a protected team page.
    await page.goto(PROTECTED_PATH);
    await expect(page).toHaveURL(new RegExp(`${PROTECTED_PATH}$`));
    await expect(
      page.getByRole("heading", { name: /crew sign in/i }),
    ).toHaveCount(0);

    // 3. Invalidate the server-side session cookie WITHOUT touching React state.
    //    The auth handler bails if React user state is already null; we want
    //    it to run, so we leave React alone but kill the cookie so the post-
    //    redirect /api/auth/me cannot silently re-authenticate the user.
    //    Then dispatch the session-expired event and read sessionStorage in
    //    the same evaluate (the handler writes both keys synchronously).
    const snapshot = await page.evaluate(async () => {
      const csrfRaw = document.cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("pgtsnd_csrf="));
      const csrf = csrfRaw
        ? decodeURIComponent(csrfRaw.slice("pgtsnd_csrf=".length))
        : null;
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      });
      window.dispatchEvent(
        new CustomEvent("pgtsnd:session-expired", { detail: {} }),
      );
      return {
        savedRedirect: sessionStorage.getItem("pgtsnd_post_login_redirect"),
        savedMessage: sessionStorage.getItem("pgtsnd_session_expired_message"),
      };
    });

    expect(snapshot.savedRedirect).toBe(PROTECTED_PATH);
    expect(snapshot.savedMessage).toBe(EXPIRED_MESSAGE);

    // 4. Wait for the redirect to /team. The handler schedules
    //    window.location.assign('/team') inside a 50ms setTimeout, so the
    //    execution context will be destroyed mid-wait — that's expected.
    try {
      await page.waitForFunction(
        () => window.location.pathname === "/team",
        undefined,
        { timeout: 15_000, polling: 50 },
      );
    } catch (err) {
      // Context-destroyed errors mean the navigation already happened.
      if (!String(err).includes("Execution context was destroyed")) throw err;
      await page.waitForLoadState("domcontentloaded");
    }

    expect(new URL(page.url()).pathname).toBe(LOGIN_PATH);
    await expect(
      page.getByRole("heading", { name: /crew sign in/i }),
    ).toBeVisible();

    // The login page consumes the message on mount but leaves the redirect
    // key in place for the post-login flow to read.
    const sessionAfterRedirect = await page.evaluate(
      ([rk, mk]) => ({
        savedRedirect: sessionStorage.getItem(rk),
        savedMessage: sessionStorage.getItem(mk),
      }),
      [REDIRECT_KEY, MESSAGE_KEY] as const,
    );
    expect(sessionAfterRedirect.savedRedirect).toBe(PROTECTED_PATH);

    // 5. Re-authenticate via the same demo email and assert that the user
    //    lands on the originally protected page (not the role-default
    //    /team/dashboard).
    await page.getByLabel(/email address/i).fill(DEMO_EMAIL);
    await page.getByRole("button", { name: /send magic link/i }).click();
    await page.waitForURL(
      (url) => new URL(url).pathname !== LOGIN_PATH,
      { timeout: 15_000 },
    );

    expect(new URL(page.url()).pathname).toBe(PROTECTED_PATH);
    await expect(
      page.getByRole("heading", { name: /crew sign in/i }),
    ).toHaveCount(0);

    // Saved redirect should now be consumed.
    const sessionAfterLogin = await page.evaluate(
      ([rk, mk]) => ({
        savedRedirect: sessionStorage.getItem(rk),
        savedMessage: sessionStorage.getItem(mk),
      }),
      [REDIRECT_KEY, MESSAGE_KEY] as const,
    );
    expect(sessionAfterLogin.savedRedirect).toBeNull();
    expect(sessionAfterLogin.savedMessage).toBeNull();

    // Reference fixed names so unused-import lints don't flag the constants.
    void EVENT_NAME;
  });
});
