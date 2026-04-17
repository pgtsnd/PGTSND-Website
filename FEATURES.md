# PGTSND Productions — Feature Catalog

A plain-English index of what the app currently does, organized by area.
Use this when you come back to the project and need to remember what's in
here. Each section ends with the relevant files for when you need to dig
back in.

---

## Sign In & Access

- **Single sign-in form**: email + access token. No Google SSO. No magic
  links. Token-only by design.
- **Demo access tokens** — paste any of these on either sign-in page (the
  page lists them in a "Demo Access" panel):
  - `DEMO-OWNER-2026` — signs in as a demo owner (full team portal)
  - `DEMO-CREW-2026` — signs in as a demo crew member
  - `DEMO-CLIENT-2026` — signs in as a demo client
  Email is ignored when one of these is used. Demo users are auto-created
  in the database and their role is re-pinned on every sign-in (so they
  can never silently drift to a higher role).
- **Real access tokens** are issued from the Team Access page. They're
  hashed in the DB, can be revoked, and the JWT carries the token id so
  revoking instantly logs the user out.
- **Saved-redirect on session expiry**: if a user is bounced to login from
  a deep link, they land back on that page after signing in.
- **Session-expired message** is surfaced on the login page once after a
  forced logout.

Files: `artifacts/pgtsnd-website/src/pages/TeamLogin.tsx`,
`artifacts/pgtsnd-website/src/pages/ClientHub.tsx`,
`artifacts/api-server/src/routes/auth.ts`,
`artifacts/api-server/src/lib/auth.ts`,
`artifacts/api-server/src/lib/access-tokens.ts`

---

## Team Portal (`/team/*`)

### Dashboard
Owner pipeline view, crew status snapshot, revenue snapshot, production
schedule (Gantt charts).

### Projects
- Three-level hierarchy: **Phase → Milestone → Task**.
- Project workspace has 5 tabs: Overview, Milestones, Deliverables,
  Assets, Review.
- **Drive folder picker per project**: search Google Drive folders with
  matching substrings highlighted in both folder name and parent path.
  Search uses a process-wide TTL folder-metadata cache and breadth-first
  parent resolution so it scales to very deep / very large drives without
  timing out.

### Messages (`/team/messages`)
- **Project Groups / Direct Messages toggle** at the top of the sidebar,
  with unread badges per side.
- **DM RBAC**: crew can only DM owners/partners (never clients);
  owners/partners can DM anyone.
- **Cross-project client-message desktop notifications**: while the
  Messages tab is open, any new client message in any project the user
  can access fires a desktop notification. Clicking the notification
  focuses the window, switches to project-groups mode, and selects the
  originating project.
- **Per-project mute toggle** in the conversation header; muted projects
  skip the desktop notification but still update unread badges.

### CRM (`/team/clients`)
- Client/organization list with detail views.
- **Invoice CSV exports** with two delivery modes:
  - **Download** — straight CSV download.
  - **Email** — sends the CSV as an attachment.
- Email export supports:
  - Multiple **To** recipients (comma-separated, deduped, capped at 25).
  - Optional **CC** list (also deduped against To).
  - Editable **Subject** and **Message** fields with placeholders showing
    the server defaults if you leave them blank.
- CSV columns include **Payment Method** and **Receipt URL** so a
  bookkeeper can reconcile without clicking into Stripe.
- **Bookkeeper email** field on Settings accepts a comma-separated list
  (capped at 10 addresses) so multiple bookkeepers/admins can be
  pre-loaded.

### Schedule, Assets, Crew
Gantt-style schedule view, central asset library, crew member directory
with rates and tax-info.

### Settings
- **Integrations panel** (Slack, Google Drive, Stripe, DocuSign).
- **Per-project notification mutes** stored in
  `project_notification_mutes` (composite PK on user + project).
- Editable bookkeeper email list (see CRM above).

### Access Tokens (`/team/access`)
- Issue, label, and revoke access tokens.
- **Last Used** column shows relative time ("3 days ago") with the exact
  timestamp on hover. Never-used tokens get a "Never used" pill.
- **Sort** dropdown: Dormant first (default), Most recently used, or
  Newest created.

### Email Previews (`/team/admin/email-previews`)
Admin-only tool for verifying how transactional emails render.
- Live preview of every email template the app sends.
- **Editable per-template sample data** (recipient name, project name,
  etc.). Changes are saved per browser via `localStorage` so they survive
  reloads.
- "Reset to defaults" button.
- **Send test email**: type any address and the currently-rendered
  template (with current sample data) is sent through the real provider.
  Subject is prefixed with `[TEST]` so it's obvious in the inbox.

---

## Client Hub (`/client-hub/*`)

Strict black & white palette throughout — no other colors, no italics.

- **Dashboard** with a review queue and headline project info.
- **Messages** with real-time send.
- **Project pages** show progress (Treatment, Storyboard, Shot List,
  Notes) but never expose granular tasks.
- **Assets** lists approved deliverables only.
- **Video Review** — see below.
- **Contracts & Billing** wired through to DocuSign and Stripe.

---

## Video Review

Used by both team and client (the same `VideoReviewPanel` component).

- Timestamped, threaded comments anchored to the video frame.
- **Resolve / reopen workflow**:
  - Comments can be resolved by team members and reopened by either the
    original author (client) or any team member.
  - **"Reopened" badge** in the comment header (yellow), parallel to the
    existing green "Resolved" badge.
  - **History block** under reopened comments shows who reopened it and
    when, plus a snapshot of the previous resolution (who resolved it and
    their resolution note).
  - The reopen action fires a notification (`notifyVideoCommentReopened`).
- **Compare mode** for side-by-side review of two deliverables.
- **Email deep links** open the right deliverable, scroll to the right
  comment, and (when the URL contains `?action=reopen`) fire the reopen
  call automatically for the original author.

---

## Notifications

- Per-recipient, per-project email notifications gated by
  `project_notification_mutes`.
- Helpers in `services/notifications.ts` cover: new messages, new client
  messages, new comments, comment replies, comment resolved, comment
  reopened, deliverable status changes, contract events, invoice events.
- Hourly background job sends review reminders for stalled deliverables.
- In-browser desktop notifications (Messages page only, see Team Portal).

---

## Integrations

| Integration  | What it's used for                                          |
|--------------|-------------------------------------------------------------|
| **Stripe**   | Invoicing, Stripe Checkout, webhook handling.               |
| **Google Drive** | Folder picker per project, file listing, signed URLs.   |
| **Slack**    | Outbound messages and channel mirroring.                    |
| **DocuSign** | Contract envelopes, signing URLs, status webhooks.          |
| **Resend**   | Transactional email provider (used by `services/email.ts`). |

All integration credentials are stored in `integration_settings`,
encrypted at rest with AES-256-GCM via the `Vault` helper. The master
key comes from `VAULT_MASTER_KEY`.

---

## Data Model Highlights

- All primary keys are **text UUIDs**.
- `users` — owner, partner, crew, client roles.
- `organizations` — client companies.
- `projects` — phases: pre_production, production, post_production,
  review, delivered.
- `tasks` — project-scoped, with status, assignee, dependencies.
- `deliverables` — outputs with review state.
- `messages` — project group messages **or** DMs (mutually exclusive
  via nullable `projectId` + nullable `recipientId`).
- `video_comments` / `video_comment_replies` — timestamped threads
  with reopen audit columns (`reopened_at`, `reopened_by`,
  `previous_resolved_*`).
- `access_tokens` — hashed, revocable; `last_used_at` is updated on
  every successful sign-in.
- `project_notification_mutes` — composite PK `(user_id, project_id)`.
- `integration_settings` — encrypted blobs per integration.

---

## What's Intentionally Not Here

- No magic-link sign-in surface (the backend route still exists for
  legacy reasons; the UI does not expose it).
- No Google SSO surface (same — backend route present, not surfaced).
- No client-side task list (clients see project progress, never the
  task graph).
- No italics in the client hub (deliberate design constraint).
- No colors other than black and white in the client hub.
