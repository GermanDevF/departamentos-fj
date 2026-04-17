# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun dev          # Start development server
bun build        # Production build
bun lint         # Run ESLint

# Admin & database scripts
bun create-admin                 # Interactive script to create the first admin user
bun db:fix-user-profiles-rls     # Fix RLS recursion on user_profiles
bun db:shared-business-rls       # Apply shared business data RLS policies
bun db:add-payments-moneda       # Add currency column to payments table
```

No test suite is configured.

## Architecture Overview

**Stack:** Next.js 16 (React 19), TypeScript, Tailwind CSS v4, Shadcn/ui + Radix UI, InsForge backend.

### Route Groups

- `app/(auth)/` — Public routes: login, register, verify-email
- `app/(protected)/dashboard/` — Authenticated routes: propiedades, inquilinos, contratos, pagos, solicitudes, usuarios

Protected routes check auth server-side via `getCurrentUser()` and redirect to `/login` if unauthenticated.

### Backend: InsForge

InsForge is the sole backend — it provides PostgreSQL with RLS, auth (JWT + refresh tokens), real-time subscriptions, and file storage. There is no separate API layer.

Three client factories in `lib/insforge/`:
- `server.ts` — server-side client (uses `INSFORGE_ANON_KEY`)
- `browser.ts` — client-side client (uses `NEXT_PUBLIC_INSFORGE_ANON_KEY`)
- `authenticated.ts` — retrieves the access token from cookies, creates a server client

### Auth Flow

`lib/auth/` handles the full auth lifecycle:
- `actions.ts` — server actions: `signIn`, `signOut`, `getCurrentUser`, `resendVerificationEmail`
- `services.ts` — `authenticateUser`, `checkUserActiveStatus` (calls InsForge RPC `get_user_profile_status`)
- `cookies.ts` — httpOnly cookie management for `access_token` / `refresh_token`
- `refresh-session.ts` — silent token refresh on expired access tokens
- `authorization.ts` — role checks (admin / staff)

New registrations start inactive and require admin approval via the Solicitudes page. `getCurrentUser()` returns `null` if the user is inactive.

### Data Layer Pattern

All CRUD operations follow this pattern:

1. **Server action** in `lib/<domain>/actions.ts` — calls `createInsForgeServerClient(accessToken)` to query InsForge tables
2. **Client hook** in `hooks/use-<domain>.ts` — calls the server action and manages local state (list, loading, dialog state)
3. **Form component** in `components/<domain>/` — uses React Hook Form + Zod schemas from `lib/validations/index.ts`

### Real-time

`components/admin-pending-realtime-provider.tsx` subscribes to InsForge real-time events and updates a badge on the Solicitudes sidebar item for pending access requests.

### UI Conventions

- Shadcn components live in `components/ui/`
- Tabler Icons (`@tabler/icons-react`) for all icons
- Toast notifications via `sonner`
- Currency display uses `lib/payments/currency.ts` formatter supporting MXN and USD
- Forms always validate with Zod schemas defined in `lib/validations/index.ts`

### Environment Variables

```
NEXT_PUBLIC_INSFORGE_URL        # InsForge backend base URL
NEXT_PUBLIC_INSFORGE_ANON_KEY   # Public anon key (browser)
INSFORGE_ANON_KEY               # Server-side anon key
NEXT_PUBLIC_APP_URL             # App URL used in email redirect links
```
