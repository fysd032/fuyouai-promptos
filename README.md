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
  migrate_entitlements.sql   # user_entitlements table + RPC (optional)

proxy.ts                     # Mobile redirect middleware
types/
  supabase.ts                # Generated Supabase database types
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
Free user → Login → 15-day trial auto-activated
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

### Invite Code System (Beta Access)

Invite codes control beta access to the platform. All `/modules/*` pages are gated — users must sign in and enter a valid invite code before accessing any module (core, general, or industry).

#### User Flow

```
1. User receives invite link:
   https://fuyouai.com/modules/core?invite=FUYOU-BETA01

2. Opens link → Not logged in → "Sign In Required" screen
   → Invite code saved to localStorage automatically

3. Clicks "Sign In" → Redirected to /login
   → Registers / logs in via email OTP

4. After login → Redirected back to original page
   → InviteGate detects saved invite code → auto-submits validation

5. Code validated via /api/invite/validate
   → Usage recorded in invite_code_usage table (with used_at timestamp)
   → SubscriptionContext refreshed → synthesizes {plan:"basic", status:"active"}
   → URL params cleared, localStorage cleared → User enters the platform

6. 15 days later → invite code trial expires
   → InviteGate shows "Trial Expired" screen → Prompts upgrade to paid plan
   → guard.ts blocks API access → User must subscribe via /pricing
```

#### Invite Link Format

```
https://fuyouai.com/modules/core?invite=FUYOU-BETA01
https://fuyouai.com/modules/core?inviteCode=FUYOU-BETA01
```

- Supports both `?invite=` and `?inviteCode=` query params
- Code is case-insensitive (auto-converted to uppercase)
- Code persists in `localStorage` across login redirects

#### Access Control Layers

| Layer | Component | Scope | Behavior |
|-------|-----------|-------|----------|
| 1. Login | `InviteGate` | All `/modules/*` pages | Not logged in → "Sign In Required" |
| 2. Invite Code | `InviteGate` | All `/modules/*` pages | Logged in but no invite → "Enter invite code" |
| 3. Trial Expiry | `InviteGate` | All `/modules/*` pages | Trial expired → "Trial Expired" screen |
| 4. Subscription State | `SubscriptionContext` | Client-side | Synthesizes {plan:"basic"} for valid invite users |
| 5. API Guard | `guard.ts` | API routes (`/api/core/run`, `/api/generate`) | Checks invite_code_usage + expiry → 401/402 |

#### 15-Day Trial Access

When a user successfully validates an invite code:

**Backend (Database)**:
- Usage recorded in `invite_code_usage` table with `used_at` timestamp
- No subscription row is created initially
- Expiry calculated dynamically: `used_at + 15 days`

**Frontend (UI)**:
- `SubscriptionContext` synthesizes a virtual subscription: `{plan:"basic", status:"active"}`
- This allows all UI components to treat invite users the same as paid basic users

**API Protection**:
- `guard.ts` checks three sources (in order):
  1. Active subscription in `subscriptions` table
  2. Valid entitlement in `user_entitlements` table
  3. Non-expired invite code usage in `invite_code_usage` table
- Trial expires when `current_time > used_at + 15 days`
- After expiry: InviteGate shows "Trial Expired" → prompts upgrade to paid plan

#### Database Tables

**Supabase setup**: Run `database/invite_codes.sql` in Supabase SQL Editor.

```sql
-- invite_codes: stores available invite codes
-- Fields: code (PK), max_uses, used_count, channel, active, created_at

-- invite_code_usage: tracks which user used which code
-- Fields: id, code (FK), user_id, used_at, created_at
-- Constraint: UNIQUE(code, user_id) — same user can't use same code twice
-- Note: used_at timestamp is used to calculate 15-day trial expiry

-- user_entitlements (optional): manual entitlement grants
-- Fields: id, user_id, type, expires_at, created_at
-- Constraint: UNIQUE(user_id, type)
-- Used for: manually granting beta_trial or other entitlements
-- guard.ts checks this table as fallback #2 (after subscriptions, before invite_code_usage)
```

#### Managing Invite Codes

**Add a new code:**
```sql
INSERT INTO invite_codes (code, max_uses, channel)
VALUES ('FUYOU-NEWCODE', 100, 'channel-name');
```

**Disable a code:**
```sql
UPDATE invite_codes SET active = false WHERE code = 'FUYOU-NEWCODE';
```

**Check usage stats:**
```sql
SELECT code, max_uses, used_count, active, created_at
FROM invite_codes ORDER BY created_at DESC;
```

**See who used a code:**
```sql
SELECT u.email, u.used_at, u.code
FROM invite_code_usage u
ORDER BY u.used_at DESC;
```

**Check trial expiry status for a user:**
```sql
SELECT
  user_id,
  code,
  used_at,
  used_at + INTERVAL '15 days' as expires_at,
  CASE
    WHEN NOW() < used_at + INTERVAL '15 days' THEN 'active'
    ELSE 'expired'
  END as trial_status
FROM invite_code_usage
WHERE user_id = 'user-uuid-here';
```

#### Validation Flow (Backend)

When `/api/invite/validate` receives a code:

1. **Check existing usage**: Query `invite_code_usage` for this user
   - If found → Return `{ok: true, alreadyRedeemed: true}` + bust cache

2. **Validate code**: Query `invite_codes` table
   - Code doesn't exist → `400 Invalid invite code`
   - Code inactive → `400 Invite code is disabled`
   - Code exhausted (used_count ≥ max_uses) → `400 Invite code exhausted`

3. **Record usage**: Insert into `invite_code_usage`
   - Duplicate (23505 error) → Ignore (idempotent)
   - Other error → `500 Failed to record usage`

4. **Update count**: Optimistic increment of `invite_codes.used_count`
   - Uses `.eq("used_count", old_value)` for concurrent safety

5. **Bust cache**: Call `bustEntitlement(userId)` to clear Redis

6. **Return success**: `{ok: true, alreadyRedeemed: false, trialDays: 15}`

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_INVITE_ENABLED` | `true` | Set `false` to disable invite gate (open access) |
| `NEXT_PUBLIC_DEV_MODE` | `false` | Set `true` locally to bypass invite gate + InviteGate |

**Important**: Do NOT set `NEXT_PUBLIC_DEV_MODE=true` on Vercel production — it bypasses all access controls.

#### Troubleshooting

**Issue**: User enters valid code but still sees "subscription expired"
- **Cause**: Redis cache not busted after validation, or SubscriptionContext not refreshed
- **Fix**: `InviteGate` calls `await refreshSubscription()` after successful validation

**Issue**: User can access UI but API returns 402
- **Cause**: `guard.ts` not checking `invite_code_usage` table
- **Fix**: Ensure `guard.ts` includes Step 3c (invite code fallback check)

**Issue**: Trial expired but user still has access
- **Cause**: Expiry calculation incorrect, or `used_at` is null
- **Fix**: Check `invite_code_usage.used_at` timestamp; recalculate expiry as `used_at + 15 days`

**Issue**: Auto-submit fires multiple times
- **Cause**: `autoSubmitted` ref not preventing re-runs
- **Fix**: `InviteGate` uses `autoSubmitted.current = true` before calling `submitCode()`

**Issue**: Invite code exhausted prematurely
- **Cause**: Concurrent requests incrementing `used_count` without locking
- **Fix**: Optimistic locking with `.eq("used_count", codeRow.used_count)` prevents over-increment

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

**Core Framework Features**:
- Tier-aware execution (Basic vs Pro prompts)
- Engine selection (DeepSeek, Gemini)
- Real-time streaming output
- Markdown rendering with syntax highlighting
- Copy output to clipboard
- File upload support (attach documents for context)
- Voice input (speech-to-text for hands-free input)

### Mobile Support

- `/m2` route for mobile-optimized entry
- Middleware redirects mobile users from `/modules/*` to `/m2`
- Universal Modules page: single-column view with panel switching
- Core Methodologies: horizontal scrollable tabs
- "For the best experience, visit on PC / tablet" hint on mobile

---

## Architecture Decisions

### Why No Subscription Row for Invite Users?

**Decision**: Invite code validation records usage in `invite_code_usage` but does NOT create a subscription row.

**Rationale**:
1. **Separation of Concerns**: Paid subscriptions vs. trial access have different lifecycles
2. **Simpler Expiry Logic**: Calculate `used_at + 15 days` dynamically instead of managing `trial_end` timestamps
3. **No Overwrites**: Avoids accidentally overwriting existing paid subscriptions
4. **Cleaner Data**: `subscriptions` table only contains real payment records

**Implementation**:
- `guard.ts` checks 3 sources: subscriptions → user_entitlements → invite_code_usage
- `SubscriptionContext` synthesizes virtual subscription for UI consistency
- Expiry calculated on-the-fly in both `/api/invite/status` and `guard.ts`

---

### Why Remove RequirePlan from CoreFrameworkPage?

**Decision**: Removed `<RequirePlan>` wrapper from CoreFrameworkPage.

**Rationale**:
1. **Double Gating**: InviteGate already handles access at `/modules` layout level
2. **Invite User Friction**: RequirePlan checks `isActivePlan(subscription, "basic")` which fails for invite users without subscription rows
3. **API Protection Sufficient**: `guard.ts` already protects `/api/core/run` endpoint
4. **Simpler Flow**: One gate (InviteGate) + one API guard (guard.ts) = clearer access control

**Result**: All users who pass InviteGate can access Core Methodologies UI. API calls are still protected by subscription validation.

---

### Why Redis Caching for Entitlements?

**Decision**: Use Upstash Redis to cache entitlement checks with 120s TTL.

**Rationale**:
1. **Performance**: Avoid Supabase queries on every API call (especially for streaming responses)
2. **Cost**: Reduce Supabase read operations for high-frequency users
3. **Graceful Degradation**: Falls back to direct DB queries if Redis unavailable
4. **Busting**: Cache invalidated on subscription changes (webhook, invite validation)

**Implementation**:
- `getEntitlement(userId)` → Try Redis first, fall back to DB
- `setEntitlement(userId, {allowed, code})` → Write to Redis with 120s TTL
- `bustEntitlement(userId)` → Delete Redis key immediately

---

### Why Synthesize Subscription in SubscriptionContext?

**Decision**: When invite code is valid, synthesize `{plan:"basic", status:"active"}` in SubscriptionContext.

**Rationale**:
1. **UI Consistency**: All components use `useSubscription()` hook expecting a subscription object
2. **No Refactoring**: Avoids rewriting RequirePlan, status indicators, and other subscription-aware UI
3. **Type Safety**: TypeScript types remain consistent across paid/invite users
4. **Feature Parity**: Invite users get same UI experience as basic plan subscribers

**Trade-off**: Client state doesn't match database (invite users have no subscription row), but API guard ensures backend validation remains correct.

---

## API Reference

### Invite Code Endpoints

#### `POST /api/invite/validate`
Validate and redeem an invite code for the current user.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "code": "FUYOU-BETA01"
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "alreadyRedeemed": false,
  "channel": "twitter",
  "expiresAt": "2025-02-05T10:30:00.000Z",
  "trialDays": 15
}
```

**Response (Already Redeemed)**:
```json
{
  "ok": true,
  "alreadyRedeemed": true,
  "channel": null,
  "expiresAt": null,
  "trialDays": 15
}
```

**Errors**:
- `400` - Invalid/disabled/exhausted code
- `401` - Not authenticated
- `500` - Database error

---

#### `GET /api/invite/status`
Check if current user has valid (non-expired) invite code access.

**Headers**: `Authorization: Bearer <token>`

**Response (Verified)**:
```json
{
  "ok": true,
  "verified": true,
  "expired": false,
  "expiresAt": "2025-02-05T10:30:00.000Z"
}
```

**Response (Expired)**:
```json
{
  "ok": true,
  "verified": false,
  "expired": true,
  "expiresAt": "2025-01-21T10:30:00.000Z"
}
```

**Response (No Invite)**:
```json
{
  "ok": true,
  "verified": false,
  "expired": false,
  "expiresAt": null
}
```

---

### Subscription Endpoints

#### `GET /api/subscription`
Get current user's subscription status.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "ok": true,
  "subscription": {
    "plan": "basic",
    "status": "active",
    "cancel_at_period_end": false,
    "current_period_end": "2025-03-21T00:00:00.000Z",
    "trialEnd": null,
    "creem_customer_id": "cus_xxx",
    "creem_subscription_id": "sub_xxx",
    "updated_at": "2025-01-21T10:30:00.000Z"
  },
  "debug": {
    "userId": "uuid-here",
    "hasSubscription": true
  }
}
```

**Response (No Subscription, But Valid Invite)**:
```json
{
  "ok": true,
  "subscription": {
    "plan": "basic",
    "status": "active",
    "cancel_at_period_end": false,
    "current_period_end": null,
    "trialEnd": null,
    "creem_customer_id": null,
    "creem_subscription_id": null,
    "updated_at": null
  }
}
```
*Note: When user has valid invite code but no paid subscription, SubscriptionContext synthesizes a virtual basic plan.*

---

### Core Framework Endpoints

#### `POST /api/core/run`
Execute a core methodology engine with subscription validation.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "engineKey": "task_breakdown",
  "userInput": "Build a mobile app for task management",
  "tier": "basic"
}
```

**Response (Stream)**:
```
data: {"type":"token","token":"##"}
data: {"type":"token","token":" Task"}
data: {"type":"token","token":" Breakdown"}
...
data: {"type":"done"}
```

**Errors**:
- `401` - Not authenticated
- `402` - Subscription required/expired
- `400` - Missing engineKey or userInput
- `500` - Engine execution error

---

### Universal Module Endpoints

#### `POST /api/generate`
Execute a universal module with subscription validation.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "moduleKey": "email-writer",
  "inputs": {
    "purpose": "Follow-up after meeting",
    "tone": "professional",
    "length": "medium"
  }
}
```

**Response**:
```json
{
  "ok": true,
  "output": "Generated content here...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 300,
    "total_tokens": 450
  }
}
```

**Errors**:
- `401` - Not authenticated
- `402` - Subscription required/expired
- `400` - Missing moduleKey or inputs
- `404` - Module not found
- `500` - Generation error

---

### Payment Endpoints

#### `POST /api/checkout`
Create a Creem checkout session.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "plan": "basic"
}
```

**Response**:
```json
{
  "ok": true,
  "checkoutUrl": "https://pay.creem.io/checkout/xxx"
}
```

---

#### `POST /api/billing/portal`
Create a Creem customer portal session.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "ok": true,
  "portalUrl": "https://pay.creem.io/portal/xxx"
}
```

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

## Testing Guide

### Invite Code Flow Testing

**Test 1: New User with Valid Invite Code**

1. Start with clean state (incognito window or clear localStorage)
2. Visit `http://localhost:3000/modules/core?invite=FUYOU-BETA01`
3. Verify: "Sign In Required" screen displays
4. Click "Sign In" → Redirected to `/login`
5. Enter email → Receive OTP → Enter code
6. Verify: Redirected back to `/modules/core`
7. Verify: Invite code auto-fills and auto-submits
8. Verify: URL params cleared (`?invite=...` removed)
9. Verify: Access granted to Core Methodologies
10. Try running an engine → Verify output displays

**Expected Database State**:
```sql
-- invite_code_usage should have 1 row
SELECT * FROM invite_code_usage WHERE user_id = 'your-user-id';

-- invite_codes.used_count should increment by 1
SELECT used_count FROM invite_codes WHERE code = 'FUYOU-BETA01';

-- subscriptions table should remain empty (no row created)
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
```

---

**Test 2: Existing User Already Redeemed Code**

1. User who already redeemed a code
2. Visit `/modules/core?invite=ANOTHER-CODE`
3. Verify: Auto-submit happens
4. Verify: Returns `{alreadyRedeemed: true}`
5. Verify: No second row in `invite_code_usage`
6. Verify: Access still granted

---

**Test 3: Trial Expiry**

1. Manually set `used_at` to 16 days ago:
   ```sql
   UPDATE invite_code_usage
   SET used_at = NOW() - INTERVAL '16 days'
   WHERE user_id = 'your-user-id';
   ```
2. Clear Redis cache: `bustEntitlement(userId)` or restart Redis
3. Refresh `/modules/core`
4. Verify: "Trial Expired" screen displays
5. Verify: API calls return 402 status
6. Verify: Upgrade button links to `/pricing`

---

**Test 4: Invalid Code**

1. Visit `/modules/core?invite=INVALID-CODE`
2. Sign in
3. Verify: Auto-submit happens
4. Verify: Error message displays "Invalid invite code"
5. Verify: Access NOT granted

---

**Test 5: Exhausted Code**

1. Set `used_count = max_uses` in `invite_codes` table
2. Try redeeming → Verify "Invite code exhausted"

---

**Test 6: Disabled Code**

1. Set `active = false` in `invite_codes` table
2. Try redeeming → Verify "Invite code is disabled"

---

### Subscription Flow Testing

**Test 1: Free User → Paid Subscription**

1. Sign in without invite code (if `NEXT_PUBLIC_INVITE_ENABLED=false`)
2. Visit `/pricing` → Click "Subscribe to Basic"
3. Complete Creem checkout (use test card: `4242 4242 4242 4242`)
4. Webhook triggers → `subscriptions` table updated
5. Visit `/modules/core` → Run engine → Verify access

**Test 2: Invite User → Paid Subscription**

1. User with valid invite code (within 15 days)
2. Visit `/pricing` → Subscribe to Pro
3. After payment: `subscriptions` table has Pro record
4. `guard.ts` should prioritize subscription over invite code
5. Verify: Pro-tier prompts available

---

### Redis Caching Testing

**Test Cache Hit**:
```bash
# Enable gate logs
GATE_LOG=1 npm run dev

# Make API call
curl -X POST http://localhost:3000/api/core/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"engineKey":"task_breakdown","userInput":"test","tier":"basic"}'

# Check logs
# First call: cache_hit=false (queries DB)
# Second call: cache_hit=true (uses Redis, faster)
```

**Test Cache Bust**:
```bash
# After invite validation or subscription change
# Check logs: cache_hit=false (cache was cleared)
```

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

---

## Common Issues & Solutions

### TypeScript Errors

**Issue**: `Property 'used_at' does not exist on type 'never'`
```typescript
// Problem: maybeSingle() returns never without type parameter
const { data } = await db.from("invite_code_usage").select("used_at").maybeSingle();

// Solution: Add type parameter
type Row = { used_at: string | null };
const { data } = await db.from("invite_code_usage").select("used_at").maybeSingle<Row>();
```

**Issue**: `Type 'string | null' is not assignable to parameter of type 'string'`
```typescript
// Problem: userId might be null, but TypeScript loses narrowing in closures
if (!userId) return error;
await someFunction(userId); // Error: still thinks it's string | null

// Solution: Explicit type narrowing
const uid: string = userId;
await someFunction(uid); // Works
```

**Issue**: `Argument of type '...' is not assignable to parameter of type 'TablesInsert<"subscriptions">'`
```typescript
// Problem: Supabase admin client isn't typed with Database generic
const admin = getSupabaseAdmin();
await admin.from("subscriptions").insert(data); // Type error

// Solution: Cast to any (admin client intentionally untyped)
const db = getSupabaseAdmin() as any;
await db.from("subscriptions").insert(data); // Works
```

---

### Build Errors

**Issue**: Vercel build fails with "Cannot find module 'server-only'"
```bash
# Solution: Ensure 'server-only' is in dependencies, not devDependencies
npm install server-only --save
```

**Issue**: Build fails with "Module not found: Can't resolve '@/lib/...'"
```json
// Solution: Check tsconfig.json has correct paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### Runtime Errors

**Issue**: "AI returned empty response" in Universal Modules
```typescript
// Problem: Accessing wrong field on response object
const output = res.modelOutput ?? ""; // Wrong field

// Solution: Use correct field name
const output = res.output ?? "";
```

**Issue**: Redis connection fails, all API calls slow
```typescript
// Expected: guard.ts should gracefully degrade
// Check logs: Should see direct DB queries instead of Redis
// Verify UPSTASH_REDIS_REST_URL is set correctly
```

**Issue**: Invite code validation succeeds but user still blocked
```typescript
// Problem: SubscriptionContext not refreshed after validation
// Solution: InviteGate should call refreshSubscription()
await refreshSubscription();
setStatus("verified");
```

---

### Database Issues

**Issue**: Invite code usage count doesn't increment
```sql
-- Check if optimistic locking is working
SELECT code, used_count FROM invite_codes WHERE code = 'YOUR-CODE';

-- If stuck, manually fix:
UPDATE invite_codes
SET used_count = (SELECT COUNT(*) FROM invite_code_usage WHERE code = 'YOUR-CODE')
WHERE code = 'YOUR-CODE';
```

**Issue**: User has expired trial but still has access
```sql
-- Check actual expiry date
SELECT
  user_id,
  used_at,
  used_at + INTERVAL '15 days' as expires_at,
  NOW() > used_at + INTERVAL '15 days' as is_expired
FROM invite_code_usage
WHERE user_id = 'USER-UUID';

-- If used_at is NULL, update it:
UPDATE invite_code_usage SET used_at = created_at WHERE user_id = 'USER-UUID';
```

---

## Development Tips

### Local Development Shortcuts

**Bypass All Gates (Local Only)**:
```env
# .env.local
NEXT_PUBLIC_DEV_MODE=true           # Bypass InviteGate + RequirePlan
NEXT_PUBLIC_INVITE_ENABLED=false    # Disable invite code requirement
BILLING_ENABLED=0                   # Disable subscription checks
```

**Enable Debug Logging**:
```env
GATE_LOG=1  # Log every guard.ts check with timing
```

**Test Streaming Responses**:
```bash
curl -X POST http://localhost:3000/api/core/run \
  -H "Authorization: Bearer $(supabase auth get-session | jq -r .access_token)" \
  -H "Content-Type: application/json" \
  -d '{"engineKey":"task_breakdown","userInput":"Build a mobile app","tier":"basic"}' \
  -N  # --no-buffer to see streaming
```

---

### Database Seed Data

**Create Test Invite Codes**:
```sql
INSERT INTO invite_codes (code, max_uses, channel, active) VALUES
  ('DEV-TEST-01', 100, 'dev', true),
  ('DEV-TEST-02', 10, 'dev', true),
  ('DEV-EXHAUSTED', 1, 'dev', true),
  ('DEV-DISABLED', 100, 'dev', false);
```

**Create Test Subscription**:
```sql
INSERT INTO subscriptions (user_id, plan, status, current_period_end) VALUES
  ('your-user-uuid', 'pro', 'active', NOW() + INTERVAL '30 days');
```

**Manually Grant Beta Trial**:
```sql
INSERT INTO user_entitlements (user_id, type, expires_at) VALUES
  ('your-user-uuid', 'beta_trial', NOW() + INTERVAL '15 days')
ON CONFLICT (user_id, type) DO UPDATE SET expires_at = EXCLUDED.expires_at;
```

---

### Debugging Subscription Issues

**Check Full Access Chain**:
```sql
-- 1. Check subscriptions table
SELECT plan, status, trial_end, current_period_end
FROM subscriptions WHERE user_id = 'USER-UUID';

-- 2. Check user_entitlements
SELECT type, expires_at FROM user_entitlements WHERE user_id = 'USER-UUID';

-- 3. Check invite_code_usage
SELECT code, used_at, used_at + INTERVAL '15 days' as expires_at
FROM invite_code_usage WHERE user_id = 'USER-UUID';

-- 4. Check Redis cache (if available)
-- Use Redis CLI: GET entitlement:USER-UUID
```

**Clear All Access for User**:
```sql
DELETE FROM subscriptions WHERE user_id = 'USER-UUID';
DELETE FROM user_entitlements WHERE user_id = 'USER-UUID';
DELETE FROM invite_code_usage WHERE user_id = 'USER-UUID';
-- Also bust Redis: DELETE entitlement:USER-UUID
```

---
