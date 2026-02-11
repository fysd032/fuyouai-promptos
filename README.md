# FuyouAI Prompt OS

A Next.js-based AI task automation platform with structured prompt engineering and workflow execution.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Auth**: Supabase Auth (email OTP)
- **Database**: Supabase (PostgreSQL)
- **AI Engines**: DeepSeek, Gemini
- **Payment**: Creem
- **Cache**: Upstash Redis
- **Deployment**: Vercel

---

## Vite to Next.js Migration (2026-02-11)

Completed migration from Vite SPA to Next.js App Router.

### What was done

**Cleanup:**
- Removed Vite entry files (`src/main.tsx`, `src/App.tsx`, `src/components/Login.tsx`)
- Removed empty directories (`src/styles/`, `src/hooks/`)
- Removed `react-router-dom` dependency
- Renamed `middleware.ts` to `proxy.ts` (Next 16 convention)
- Updated `tsconfig.json` exclude list
- Updated `package.json` name to `fuyouai-prompt-os`

**Encoding fixes:**
- Fixed UTF-8 encoding corruption (BOM + mojibake) across 11 files in `src/`
- Translated garbled Chinese comments to English
- Fixed corrupted multilingual strings in `CoreFrameworkPage.tsx`

**Bug fixes found during migration:**
- `ModuleRunnerPage.tsx`: Fixed wrong import path (`@/lib/promptos` -> `@/src/lib/promptos`)
- `ModuleRunnerPage.tsx`: Fixed `useSearchParams()` null safety for Next 16
- `PricingPage.tsx`: Fixed SiteFooter import path and export style

### What remains (not blocking)

| Item | Status | Notes |
|------|--------|-------|
| `/m2` mobile routes | Skipped | Components exist in `src/mobile-entry/` but no `app/m2/` pages. Needs business decision |
| `src/` code organization | Optional | Many `src/` files still used by `app/` via `@/src/` imports. Works fine, just not the cleanest structure |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.local.example` or create `.env.local` with the following:

### Required

```env
# Supabase (client-side)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server-side)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# AI Engine (at least one required)
DEEPSEEK_API_KEY=
```

### Optional

```env
# AI Engine alternatives
GEMINI_API_KEY=
DEEPSEEK_BASE_URL=           # defaults to https://api.deepseek.com/v1
DEEPSEEK_MODEL=              # defaults to deepseek-chat

# API base override (empty = same-origin, which is correct for Vercel)
NEXT_PUBLIC_API_BASE=

# Upstash Redis (subscription caching)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Creem Payment
CREEM_API_KEY=
CREEM_ENV=                   # "test" or "live"
CREEM_PRODUCT_ID_BASIC=
CREEM_PRODUCT_ID_PRO=
CREEM_PRODUCT_ID_STARTER=
CREEM_WEBHOOK_SECRET_TEST=
CREEM_WEBHOOK_SECRET_LIVE=

# App
APP_URL=                     # defaults to https://fuyouai.com
BILLING_ENABLED=             # set "1" to enable billing gate
```

---

## Deploy to Vercel

### Branch strategy

```
main              <- production (current: legacy Vite SPA)
next-migration    <- Next.js version (deploy from here first)
```

### Steps

1. Push `next-migration` branch to GitHub
2. In Vercel Dashboard, import the repo or create a new project
3. Set the deploy branch to `next-migration`
4. Add all environment variables in Settings -> Environment Variables
5. Deploy and verify on the preview URL
6. Once confirmed, merge `next-migration` into `main` and switch Vercel production branch

### Vercel settings

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Node.js Version**: 18.x or 20.x

---

## Project Structure

```
app/                    # Next.js App Router pages & API routes
  api/                  # API route handlers
  modules/              # Module pages (core, general, industry)
  login/                # Login page
  pricing/              # Pricing page
  about/                # About page
  account/              # Account management pages
components/             # Top-level shared components
lib/                    # Server-side utilities (supabase, billing, llm)
src/                    # Legacy client components (still actively used)
  components/pages/     # Page-level components imported by app/
  lib/                  # Client-side API helpers
  data/                 # Static data and module configs
  config/               # Module mapping config
  context/              # React context (subscription)
proxy.ts                # Next.js 16 proxy (request interception)
```

---

## QA Checklist

Run locally with `npm run dev`, then verify:

- `/` loads, CTA buttons render, navigation works
- `/login` renders email OTP form
- `/modules/core` loads core framework page without errors
- `/modules/general` loads universal modules with category tabs
- `/modules/industry` loads industry templates
- `/pricing` shows pricing cards
- `/about` renders about page

### API endpoints

- `POST /api/generate` - Universal module execution
- `POST /api/core/run` - Core framework execution
- `POST /api/chat` - Chat endpoint
- `POST /api/intent` - Intent detection
- `POST /api/run` - Task execution
- `GET /api/registry` - Module registry
- `GET /api/subscription` - Subscription status
- `POST /api/checkout` - Payment checkout
