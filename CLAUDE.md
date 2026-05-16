# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npx tsc --noEmit` — type-check (no test suite or linter is configured)

iOS (Capacitor) wrap exists under `ios/`; sync after a web build with `npx cap sync ios`.

## Environment

Required `.env` vars (Vite-prefixed, exposed to the client):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase project credentials.
- `VITE_APP_PIN` — optional. Defaults to `1234` if unset. This is the lock-screen PIN — it is a client-side gate, not auth.

The Netlify function `netlify/functions/process-po.js` uses a server-side `OPENAI_API_KEY` (GPT-4o vision OCR for purchase orders); this is set in Netlify, not in `.env`.

Deploy target is Netlify (`netlify.toml`), with SPA fallback to `index.html`.

## Architecture

Single-page React 18 + TypeScript app over Supabase. One table (`entries`) is the source of truth; everything else is derived.

**Data flow.** `src/services/api.ts` is the only file that talks to Supabase. The `entries` table is read/written through three functions (`list`, `create`, `remove`). `useEntryStore` (Zustand) wraps `api`, holds the full entry list in memory, and exposes derived selectors (`vendorSummaries`, `patientSummaries`, `productSummaries`, `totalCost`) that pages call directly — pages never re-aggregate. When adding a new view or report, prefer adding a selector to `useEntryStore` over duplicating grouping logic in a page.

**Auth/session model.** There is no Supabase Auth. `useSessionStore` is a PIN-gated client lock persisted in `sessionStorage`; `useSessionTimeout` (15 min idle, see `SESSION_TIMEOUT_MS`) re-locks the app. Treat this as UX, not security — the Supabase anon key reaches the browser and any RLS must be enforced server-side.

**Routing & shell.** `App.tsx` renders `<LockScreen>` while locked, otherwise mounts `<Dashboard>` with lazy-loaded routes from `ROUTES` in `src/lib/constants.ts`. The bottom nav in `Dashboard.tsx` only surfaces a subset of routes (Products, Patients, Add, Commission, Summary) — others (MiMedx, PriceSheets, Vendors, AuditLog) are reachable but unlinked. Adding a route means: define it in `ROUTES`, add the lazy import + `<Route>` in `App.tsx`, and optionally add a `NAV_ITEMS` entry in `Dashboard.tsx`.

**Forms.** `react-hook-form` + Zod via `@hookform/resolvers/zod`. `AddEntry.tsx` is the canonical pattern — define the Zod schema, infer the form type, pass through `zodResolver`. The barcode scanner (`@zxing/browser`) is wired into Add Entry's item-number field.

**Toasts/UI.** `useUIStore` exposes `showToast(type, message)`; toasts auto-dismiss after 3s. Always surface API errors through this rather than `console.error` or thrown errors that propagate to the boundary.

## Conventions

- Path alias `@/*` → `src/*` (both `tsconfig.json` and `vite.config.ts`); use it instead of relative paths.
- The `Entry` shape in `src/types/index.ts` mirrors the `entries` Supabase table column-for-column. Any schema change has to land in both places.
- Styling is plain CSS in `src/index.css` with semantic class names (`.page`, `.input`, `.btn`, `.form-row`, etc.) — no Tailwind, no CSS-in-JS. Reuse existing classes before inventing new ones.
- `mockData.json` at the repo root is seed/demo data, not a runtime source.
