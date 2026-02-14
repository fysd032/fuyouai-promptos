# FuyouAI Prompt OS

A Next.js-based AI task automation platform with structured prompt engineering and workflow execution.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Auth**: Supabase Auth (email OTP, passwordless)
- **Database**: Supabase (PostgreSQL)
- **AI Engines**: DeepSeek, Gemini
- **Payment**: Creem
- **Cache**: Upstash Redis (optional)
- **Deployment**: Vercel

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create `.env.local` with the following:

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
BILLING_ENABLED=             # set "1" to enable billing gate on API routes
```

### Developer & Beta Controls

```env
# Developer mode (local only, do NOT set in Vercel production)
NEXT_PUBLIC_DEV_MODE=true    # shows dev panel, bypasses invite gate & RequirePlan

# Invite code gate (production)
# Default: enabled. Set to "false" to disable and open access to all users
NEXT_PUBLIC_INVITE_ENABLED=false
```

---

## Project Structure

```
app/                         # Next.js App Router pages & API routes
  api/
    core/run/                # Core framework execution
    generate/                # Universal module execution
    invite/validate/         # Invite code validation
    invite/status/           # Invite code status check
    subscription/            # Subscription status
    checkout/                # Payment checkout
    webhook/creem/           # Payment webhook
    chat/                    # Chat endpoint
    intent/                  # Intent detection
    run/                     # Task execution
    registry/                # Module registry
    billing/portal/          # Billing portal
    test-trial/              # Trial activation
    ping/                    # Health check
  modules/                   # Module pages
    core/                    # Core Methodologies (5 engines)
    general/                 # Universal Modules (categories + variants)
    industry/                # Industry Templates
    layout.tsx               # Wraps with SubscriptionProvider + InviteGate
  login/                     # Login page (email OTP)
  pricing/                   # Pricing page
  about/                     # About page
  account/                   # Account management (subscription, billing)
  m2/                        # Mobile-optimized pages
  privacy/                   # Privacy policy
  terms/                     # Terms of service
  refund/                    # Refund policy
  layout.tsx                 # Root layout
  globals.css                # Global styles

components/                  # Top-level shared components
  Login.tsx                  # Login form (email OTP + invite code)
  ModuleShell.tsx            # App shell (sidebar, topbar, drawer)
  Topbar.tsx                 # Top navigation bar
  Sidebar.tsx                # Side navigation

src/                         # Client-side source
  components/
    pages/                   # Page-level components
      CoreFrameworkPage.tsx   # Core Methodologies page
      UniversalModulesPage.tsx # Universal Modules page
      IndustryTemplatesPage.tsx
      PricingPage.tsx
    InviteGate.tsx           # Beta invite code gate
    RequirePlan.tsx          # Subscription paywall
    ModuleRunner.tsx         # Module execution UI
    StatusFeedback.tsx       # Status indicator
    ErrorBoundary.tsx        # Error boundary
    ConsoleLayout.tsx        # Console layout
  context/
    SubscriptionContext.tsx   # Global subscription state
  lib/
    supabaseClient.ts        # Browser-side Supabase client
    coreframework-api.ts     # Core framework API helper
    api.ts                   # General API helper
    gemini.ts                # Gemini engine client
  data/
    universalModules.ts      # Module definitions
    industryTemplates.ts     # Industry template data
    ui-corekey-map.ts        # UI key to backend key mapping
  config/
    moduleMapping.ts         # Module routing config
  mobile-entry/              # Mobile-specific pages and config

lib/                         # Server-side utilities
  supabase/server.ts         # Server-side Supabase client
  supabaseAdmin.ts           # Admin Supabase client (bypasses RLS)
  billing/
    guard.ts                 # Subscription validation guard
    with-subscription.ts     # Billing middleware wrapper
    entitlement-cache.ts     # Redis entitlement caching
    redis.ts                 # Redis client
  promptos/                  # Prompt engine logic
    run-engine.ts            # Engine execution
    core/                    # Core framework prompt resolution

database/
  invite_codes.sql           # Invite code schema + seed data

proxy.ts                     # Mobile redirect middleware
```

---

## Feature Architecture

### Authentication Flow

```
User visits /login
  → Enter email → Receive OTP via email → Enter 8-digit code
  → Session created (persisted in localStorage)
  → Redirect to /modules/core
```

- Passwordless login via Supabase email OTP
- `shouldCreateUser: true` — new users auto-register
- Session auto-refreshes via Supabase client

### Subscription & Billing

```
Free user → Login → 30-day trial auto-activated
  → Trial expires → Must subscribe via /pricing
  → Payment via Creem → Webhook updates subscription
```

| Plan | Price | Features |
|------|-------|----------|
| Basic | $29/mo | All modules, basic tier prompts |
| Pro | $69/mo | All modules, pro tier prompts, priority engines |

- `BILLING_ENABLED=1` activates billing gate on API routes
- `RequirePlan` component gates UI features by plan level
- `SubscriptionProvider` provides global subscription state to all module pages
- CoreFrameworkPage auto-detects user plan and sends correct tier to backend

### Invite Code System (Beta)

```
User logs in → Enters /modules/* → InviteGate checks status
  → Already verified → Show content
  → Not verified → Show invite code input
  → Enter valid code → Recorded in DB → Show content (permanent)
```

- Codes managed in Supabase `invite_codes` table
- Each code has: max_uses, used_count, channel (for attribution)
- Usage tracked per user in `invite_code_usage` table
- URL pre-fill: `fuyouai.com/modules/core?invite=FUYOU-BETA01`
- Dev mode (`NEXT_PUBLIC_DEV_MODE=true`) bypasses gate
- Disable gate: set `NEXT_PUBLIC_INVITE_ENABLED=false` in Vercel

**Supabase setup**: Run `database/invite_codes.sql` in SQL Editor.

**Add new codes**:
```sql
INSERT INTO invite_codes (code, max_uses, channel)
VALUES ('FUYOU-NEWCODE', 100, 'channel-name');
```

### Developer Mode

Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` (local only):

- DEV panel on Core Methodologies page: tier toggle (basic/pro), engine toggle (deepseek/gemini)
- Shows current subscription status for debugging
- Bypasses RequirePlan paywall
- Bypasses InviteGate

### Core Methodologies (5 Engines)

| Engine | Key | Description |
|--------|-----|-------------|
| Task Decomposition | `task_breakdown` | Break complex requirements into execution steps |
| CoT Reasoning | `cot_reasoning` | Step-by-step logical reasoning |
| Content Generation | `content_builder` | Structured long-form content creation |
| Deep Analysis | `analytical_engine` | Multi-dimensional analytical reasoning |
| Complex Task Tree | `task_tree` | Hierarchical task structure with dependencies |

### Mobile Support

- `/m2` route for mobile-optimized entry
- Middleware redirects mobile users from `/modules/*` to `/m2`
- Universal Modules page: single-column view with panel switching
- Core Methodologies: horizontal scrollable tabs
- "For the best experience, visit on PC / tablet" hint on mobile

---

## Deploy to Vercel

### Branch Strategy

```
main              ← production
next-migration    ← development branch
```

### Steps

1. Push to GitHub
2. Import repo in Vercel Dashboard
3. Set deploy branch
4. Add all environment variables in Settings → Environment Variables
5. Deploy and verify

### Vercel Settings

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Node.js Version**: 18.x or 20.x

### Production Environment Variables Checklist

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | |
| `SUPABASE_URL` | Yes | Same as NEXT_PUBLIC version |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Secret, server-only |
| `DEEPSEEK_API_KEY` | Yes | |
| `GEMINI_API_KEY` | Optional | For Gemini engine |
| `BILLING_ENABLED` | Set to `1` | Enable subscription checking |
| `CREEM_API_KEY` | Yes (if billing) | Payment provider |
| `CREEM_ENV` | `live` | Payment environment |
| `UPSTASH_REDIS_REST_URL` | Optional | Subscription caching |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | |
| `NEXT_PUBLIC_INVITE_ENABLED` | Optional | Set `false` to disable invite gate |

---

## QA Checklist

Run locally with `npm run dev`, then verify:

### Pages
- `/` — Landing page loads, CTA buttons work
- `/login` — Email OTP form renders
- `/modules/core` — Core Methodologies with 5 engine tabs
- `/modules/general` — Universal Modules with category filter + search
- `/modules/industry` — Industry Templates
- `/pricing` — Pricing cards display
- `/about` — About page renders
- `/m2` — Mobile entry page

### API Endpoints
- `POST /api/core/run` — Core framework execution
- `POST /api/generate` — Universal module execution
- `GET /api/registry` — Module registry
- `GET /api/subscription` — Subscription status
- `POST /api/checkout` — Payment checkout
- `POST /api/invite/validate` — Invite code validation
- `GET /api/invite/status` — Invite code status
- `POST /api/chat` — Chat endpoint
- `POST /api/intent` — Intent detection
- `GET /api/ping` — Health check

### Mobile
- Core Methodologies: 5 tabs display horizontally (scrollable)
- Universal Modules: single-column with panel switching
- Navigation drawer works
