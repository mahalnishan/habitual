# Cursor Prompt — Habitual (Next.js + PocketBase)

**Context**: You are working inside an existing **Next.js (App Router) + Tailwind** project named **`habitual`**. Implement a minimal **GitHub-style habit tracker** using **PocketBase** for DB + Auth. Keep code small, readable, and production-friendly.

---

## Goals
1) Add PocketBase (auth + data). 2) CRUD habits + toggle daily entries. 3) Show a GitHub-like 52‑week heatmap. 4) Secure per-user data.

---

## Stack
- Next.js 14+ (App Router, Server Actions)
- Tailwind CSS (already installed)
- **PocketBase** (self-host/local, SQLite) — use JS SDK

Install SDK:
```bash
npm i pocketbase
```

---

## PocketBase Setup (Collections)
Create these collections (via Admin UI or migrations):

### `users` (built-in)
Enable email/password auth.

### `habits`
- `name` (text, required)
- `color` (text, default `#22c55e`)
- `owner` (relation → `users`, maxSelect 1, required)

**Rule (list/view/create/update/delete):** only owner
```text
@request.auth.id != "" && owner.id = @request.auth.id
```

### `entries`
- `habit` (relation → `habits`, required)
- `date` (date, required)  // store midnight UTC
- `value` (number, min 1, default 1)
- `owner` (relation → `users`, required)

**Unique index:** (`habit`, `date`)

**Rule (list/view/create/update/delete):** only owner
```text
@request.auth.id != "" && owner.id = @request.auth.id
```

---

## Env
Create `.env.local`:
```env
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
```
Run PocketBase locally in another terminal:
```bash
./pocketbase serve
```

---

## Minimal App Implementation

### 1) PocketBase client helpers
**`lib/pb.ts`**
- Export `getPB()` for **server** (creates PocketBase with `pb.authStore.loadFromCookie(cookies().toString())` and returns instance).
- Export `getPBClient()` for **client** (singleton using `NEXT_PUBLIC_PB_URL`).
- Export `persistAuthToCookies(pb)` to set `Set-Cookie` in **server actions** after auth changes.

### 2) Auth
- Pages: `/login` and `/signup` with email/password using `pb.collection('users').authWithPassword(email, password)`.
- Server actions should call `persistAuthToCookies` to keep session.
- Add a simple `SignOut` action calling `pb.authStore.clear()` and clearing cookie.
- Protect app with a middleware in `app/(app)/layout.tsx`: if no `pb.authStore.isValid`, redirect to `/login`.

### 3) Data actions (Server Actions in `app/actions.ts`)
- `createHabit(name, color)` → set `owner` to `pb.authStore.model?.id`.
- `updateHabit(id, data)`.
- `deleteHabit(id)` (cascade: delete its entries).
- `toggleEntry(habitId, isoDate)`:
  - find existing entry for that day; if exists → delete; else → create `{habit, date, value: 1, owner}`.
- `getRange(startISO, endISO)` helper to fetch entries for last 370 days for current user.
- `revalidatePath('/')` after mutations.

### 4) UI (keep it small)
- `app/page.tsx` (Server Component):
  - Fetch habits and entries for last 52 weeks.
  - Compute per‑day counts; pass to heatmap.
  - Render: add habit form, list (edit/delete), today toggles per habit, select “All” vs one habit.
- `components/Heatmap.tsx` (Client):
  - Render 7×53 grid (Mon‑Sun, last 52 weeks, end = today).
  - 5 color buckets like GitHub.
  - Tooltip + `aria-label`.
  - If a single habit is selected, allow clicking a cell to call `toggleEntry` for that date.

**Date utilities** (inline or `lib/date.ts`): `startOfTodayUTC`, `eachDayOfLast52Weeks`, `toISO(date)`.

---

## Commands
```bash
# 1) run pocketbase (separate terminal)
./pocketbase serve

# 2) app dev
npm run dev
```

---

## Acceptance
- New user can sign up, log in, create a habit, and toggle today.
- Heatmap displays last 52 weeks; selecting a habit makes cells clickable.
- All data is private per user due to collection rules.

> Keep code concise. Prefer server actions over API routes where possible. Keep styling minimal but readable with Tailwind.

