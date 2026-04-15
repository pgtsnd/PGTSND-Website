# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### PGTSND Productions Website (`artifacts/pgtsnd-website`)
- **Type**: React + Vite (frontend-only, no backend)
- **Preview path**: `/`
- **Purpose**: Pixel-faithful clone of pgtsndproductions.com migrated from Squarespace
- **Pages**: Home, Services, About, Case Studies, Contact, Client Hub (login/register with magic link + invite token)
- **Client Portal** (`/client-hub/*`): Dashboard, Messages, Projects, Assets, Video Review, Billing, Account — uses `ClientLayout.tsx` sidebar layout, all mock data for now
  - **Dashboard**: Welcome banner, review queue with reminders, recent messages feed, active project status cards
  - **Messages** (`ClientMessages.tsx`): Full threaded chat with conversation sidebar, team/client bubble layout, file attachments, unread badges
  - **Projects** (`ClientProjects.tsx`): Gantt-style schedule with phase bars + "TODAY" marker, expandable sections (Treatment, Storyboard, Shot List, Client Notes), team roster
  - **Assets** (`ClientAssets.tsx`): Finder-style folder browser with breadcrumbs, folder grid → file list view, drag-drop upload zone, download icons
  - **Video Review** (`ClientVideoReview.tsx`): Video player with colored timeline dots per comment, clickable dots to highlight comment, threaded replies, "Approve This Draft" / "Request Changes" buttons, version selector
  - **Billing** (`ClientBilling.tsx`): Invoice table with Pay Now buttons, subscriptions & recurring section, payment history with CSV export, payment method cards (Visa/ACH), Pay modal with payment method selector and Confirm Payment button
- **Design**: Black background, white text, bold Montserrat 900 weight headings, pill-shaped CTA buttons, hamburger nav overlay
- **Images**: Loaded directly from Squarespace CDN URLs
- **Logo**: Uses attached_assets/logo.webp via @assets alias
- **No backend required**: Pure frontend, contact form is client-side only

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
