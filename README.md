# 🚀 FuyouAI Prompt OS

A production-ready Next.js AI automation platform with structured prompt engineering, multi-model support, and enterprise-grade billing integration.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Features

### 🎯 Core Methodologies
- **5 AI Engines**: Task Decomposition, CoT Reasoning, Content Generation, Deep Analysis, Task Tree
- **Multi-Model Support**: DeepSeek (primary), Gemini (optional)
- **Tier System**: Basic and Pro tier prompts with automatic detection
- **Real-time Streaming**: Token-by-token output with TypeScript SSE
- **File Upload**: .txt/.md files up to 500KB with attachment preview
- **Voice Input**: Web Speech API with real-time transcription

### 📦 Universal Modules
- **50+ Pre-built Templates**: Email, social media, SEO, coding, analysis
- **Category Filtering**: Business, Marketing, Technical, Creative, Personal
- **Variant System**: Multiple approaches per module (formal, casual, technical)
- **Plugin Support**: File upload and voice input for all modules

### 🎫 Invite Code System (Beta Access)
- **15-Day Trial**: Auto-granted on invite code validation
- **Usage Tracking**: Prevents duplicate redemptions per user
- **Auto-Expiry**: Locks access after 15 days, prompts upgrade
- **Admin Dashboard**: Track usage statistics and manage codes

### 💳 Payment Integration (Creem)
- **Subscription Plans**: Basic ($29/mo), Pro ($69/mo)
- **Webhook Idempotency**: Prevents duplicate payment processing
- **Auto-upgrade/Downgrade**: Sync subscription status in real-time
- **Customer Portal**: Self-service billing management

### 🔒 Access Control
- **Multi-layer Gating**: InviteGate → SubscriptionContext → API Guard
- **Redis Caching**: 120s TTL for entitlement checks (99% query reduction)
- **Graceful Degradation**: Falls back to direct DB queries if Redis unavailable
- **Developer Mode**: Local-only bypass for testing (disabled in production)

### 📱 Mobile Optimization
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Touch-friendly UI**: Large tap targets, horizontal scrollable tabs
- **Dedicated Entry**: `/m2` route with optimized layout
- **Auto-redirect**: Middleware detects mobile user agents

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.0 (strict mode) |
| **Styling** | Tailwind CSS 4 |
| **UI Icons** | Lucide React |
| **Auth** | Supabase Auth (Email OTP, passwordless) |
| **Database** | Supabase (PostgreSQL) |
| **Cache** | Upstash Redis (optional) |
| **AI Models** | DeepSeek (primary), Gemini (optional) |
| **Payment** | Creem Payment Gateway |
| **Deployment** | Vercel (Edge Functions) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- DeepSeek API key ([get it here](https://platform.deepseek.com))
- (Optional) Creem account for payment

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/fuyouai-promptos.git
cd fuyouai-promptos

# Install dependencies
npm install

# Copy environment variables
cp .env.production.example .env.local

# Edit .env.local with your credentials
# Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

### Required (Production)

```bash
# Supabase (Client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (Server-side - Service Role)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ Keep secret!

# AI Engine (Required)
DEEPSEEK_API_KEY=sk-xxxxx  # ⚠️ Keep secret!

# Payment (Creem - if using billing)
CREEM_API_KEY=creem_li_xxxxx  # ⚠️ Keep secret!
CREEM_ENV=live  # Must be "live" for production
CREEM_PRODUCT_ID_BASIC=prod_xxxxx
CREEM_PRODUCT_ID_PRO=prod_xxxxx
CREEM_PRODUCT_ID_STARTER=prod_xxxxx
CREEM_WEBHOOK_SECRET_LIVE=whsec_xxxxx  # ⚠️ Keep secret!
```

### Optional (Recommended)

```bash
# Redis Cache (performance boost)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Gemini AI (alternative model)
GEMINI_API_KEY=your-gemini-key

# Application
APP_URL=https://fuyouai.com
BILLING_ENABLED=1  # Enable subscription checks
GATE_LOG=0  # Set to 1 for detailed access logs
```

### Development Only

```bash
# Local development only - NEVER set in production!
NEXT_PUBLIC_DEV_MODE=true  # Bypasses InviteGate and RequirePlan
```

**⚠️ Security Warning**:
- Never commit `.env.local` to Git
- Never set `NEXT_PUBLIC_DEV_MODE=true` in Vercel production
- Keep all API keys and secrets secure

---

## 📁 Project Structure

```
fuyouai-promptos/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── core/run/             # Core framework execution
│   │   ├── generate/             # Universal module execution
│   │   ├── invite/               # Invite code validation & status
│   │   ├── subscription/         # Subscription management
│   │   ├── checkout/             # Payment checkout
│   │   ├── webhook/creem/        # Creem payment webhook
│   │   └── billing/portal/       # Customer billing portal
│   ├── modules/                  # Module pages
│   │   ├── core/                 # Core Methodologies
│   │   ├── general/              # Universal Modules
│   │   ├── industry/             # Industry Templates
│   │   └── layout.tsx            # Wraps with SubscriptionProvider + InviteGate
│   ├── login/                    # Email OTP login
│   ├── pricing/                  # Pricing & subscription plans
│   ├── account/                  # Account management
│   └── m2/                       # Mobile-optimized pages
│
├── src/                          # Client components & utilities
│   ├── components/
│   │   ├── pages/                # Page-level components
│   │   │   ├── CoreFrameworkPage.tsx     # 5 AI engines with file & voice
│   │   │   ├── UniversalModulesPage.tsx  # 50+ templates
│   │   │   └── IndustryTemplatesPage.tsx
│   │   ├── InviteGate.tsx        # Beta access gate with auto-submit
│   │   ├── RequirePlan.tsx       # Subscription paywall
│   │   ├── ModuleRunner.tsx      # Module execution with plugins
│   │   └── ErrorBoundary.tsx     # Error boundary
│   ├── context/
│   │   └── SubscriptionContext.tsx  # Global subscription state
│   ├── lib/
│   │   ├── supabaseClient.ts     # Browser Supabase client
│   │   ├── coreframework-api.ts  # Core framework API helpers
│   │   └── api.ts                # General API utilities
│   └── data/
│       ├── universalModules.ts   # 50+ module definitions
│       └── ui-corekey-map.ts     # UI key → backend key mapping
│
├── lib/                          # Server-side utilities
│   ├── supabase/server.ts        # Server Supabase client
│   ├── supabaseAdmin.ts          # Admin client (bypasses RLS)
│   ├── billing/
│   │   ├── guard.ts              # Subscription validation (3-step fallback)
│   │   ├── with-subscription.ts  # API middleware wrapper
│   │   ├── entitlement-cache.ts  # Redis caching (120s TTL)
│   │   └── redis.ts              # Upstash Redis client
│   ├── llm/
│   │   └── provider.ts           # DeepSeek/Gemini provider
│   ├── promptos/
│   │   ├── run-engine.ts         # Prompt execution engine
│   │   └── core/                 # Core framework prompt resolution
│   └── creem/
│       └── env.ts                # Creem environment resolver
│
├── database/                     # SQL migration scripts
│   ├── invite_codes.sql          # Invite code tables + seed data
│   ├── migrate_entitlements.sql  # User entitlements table
│   └── init-production.sql       # Complete database initialization
│
├── components/                   # Shared UI components
│   ├── Login.tsx                 # Email OTP login form
│   ├── Pricing.tsx               # Pricing cards
│   └── ModuleShell.tsx           # App layout shell
│
├── .env.production.example       # Environment variable template
├── DEPLOYMENT_CHECKLIST.md       # Step-by-step deployment guide
└── README.md                     # This file
```

---

## 🎫 Invite Code System

### Overview

FuyouAI uses invite codes to control beta access. All `/modules/*` pages are gated — users must sign in and enter a valid invite code before accessing any module.

### User Flow

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

### Access Control Layers

| Layer | Component | Scope | Behavior |
|-------|-----------|-------|----------|
| 1. Login | `InviteGate` | All `/modules/*` pages | Not logged in → "Sign In Required" |
| 2. Invite Code | `InviteGate` | All `/modules/*` pages | Logged in but no invite → "Enter invite code" |
| 3. Trial Expiry | `InviteGate` | All `/modules/*` pages | Trial expired → "Trial Expired" screen |
| 4. Subscription State | `SubscriptionContext` | Client-side | Synthesizes {plan:"basic"} for valid invite users |
| 5. API Guard | `guard.ts` | API routes (`/api/core/run`, `/api/generate`) | Checks invite_code_usage + expiry → 401/402 |

### 15-Day Trial Access

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

### Database Tables

```sql
-- invite_codes: stores available invite codes
CREATE TABLE invite_codes (
  code       VARCHAR(32) PRIMARY KEY,
  max_uses   INT NOT NULL DEFAULT 50,
  used_count INT NOT NULL DEFAULT 0,
  channel    VARCHAR(64),
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invite_code_usage: tracks which user used which code
CREATE TABLE invite_code_usage (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(32) NOT NULL REFERENCES invite_codes(code),
  user_id    UUID NOT NULL,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code, user_id)
);

-- user_entitlements (optional): manual entitlement grants
CREATE TABLE user_entitlements (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL DEFAULT 'beta_trial',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);
```

### Managing Invite Codes

**Add a new code:**
```sql
INSERT INTO invite_codes (code, max_uses, channel) VALUES
  ('FUYOU-LAUNCH2025', 500, 'launch');
```

**Disable a code:**
```sql
UPDATE invite_codes SET active = false WHERE code = 'FUYOU-BETA01';
```

**Check usage stats:**
```sql
SELECT code, max_uses, used_count, active, channel, created_at
FROM invite_codes ORDER BY created_at DESC;
```

**See who used a code:**
```sql
SELECT u.user_id, u.code, u.used_at,
       u.used_at + INTERVAL '15 days' as expires_at,
       CASE
         WHEN NOW() < u.used_at + INTERVAL '15 days' THEN 'active'
         ELSE 'expired'
       END as trial_status
FROM invite_code_usage u
ORDER BY u.used_at DESC;
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_INVITE_ENABLED` | `true` | Set `false` to disable invite gate (open access) |
| `NEXT_PUBLIC_DEV_MODE` | `false` | Set `true` locally to bypass invite gate (dev only) |

**⚠️ Important**: Do NOT set `NEXT_PUBLIC_DEV_MODE=true` on Vercel production — it bypasses all access controls.

---

## 💳 Subscription & Billing

### Plans

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | View-only access (after trial expires) |
| **Basic** | $29/mo | All modules, basic tier prompts, file upload, voice input |
| **Pro** | $69/mo | All modules, pro tier prompts, priority engines, premium support |

### Payment Flow

```
User clicks "Subscribe" on /pricing
  → Redirected to Creem checkout
  → Completes payment
  → Webhook received at /api/webhook/creem
  → Subscription created/updated in database
  → Redis cache busted
  → User gains access immediately
```

### Webhook Events

The platform handles the following Creem webhook events:

**Upgrade Events** (activate subscription):
- `checkout.completed`
- `subscription.created`
- `subscription.active`
- `subscription.paid`
- `subscription.update`

**Scheduled Cancel** (mark for cancellation at period end):
- `subscription.scheduled_cancel`

**Downgrade Events** (cancel subscription):
- `subscription.canceled`
- `subscription.expired`
- `charge.refunded`
- `refund.created`

### Webhook Configuration

In Creem Dashboard:

```
URL: https://fuyouai.com/api/webhook/creem
Environment: Production
Events: (subscribe to all events listed above)
```

Copy the webhook secret and set in Vercel:
```bash
CREEM_WEBHOOK_SECRET_LIVE=whsec_xxxxx
```

---

## 🗄️ Database Setup

### 1. Run in Supabase SQL Editor

```sql
-- Option A: Run the complete initialization script
-- Copy and paste database/init-production.sql

-- Option B: Run individual scripts
-- 1. Invite code system
-- Copy and paste database/invite_codes.sql

-- 2. User entitlements (optional)
-- Copy and paste database/migrate_entitlements.sql

-- 3. Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                   VARCHAR(32) NOT NULL DEFAULT 'free',
  status                 VARCHAR(32) NOT NULL DEFAULT 'inactive',
  trial_start            TIMESTAMPTZ,
  trial_end              TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT false,
  current_period_end     TIMESTAMPTZ,
  creem_customer_id      VARCHAR(255),
  creem_subscription_id  VARCHAR(255),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Webhook events (idempotency)
CREATE TABLE IF NOT EXISTS creem_webhook_events (
  id         VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. Verify Tables Created

```sql
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'invite_codes',
    'invite_code_usage',
    'user_entitlements',
    'subscriptions',
    'creem_webhook_events'
  )
ORDER BY table_name;
```

Expected result: 5 tables

---

## 🚢 Deployment to Vercel

### Prerequisites

1. ✅ GitHub repository set up
2. ✅ Vercel account created
3. ✅ All environment variables ready
4. ✅ Supabase database initialized

### Step-by-Step Deployment

#### 1. Connect Repository

```
1. Visit https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Click "Import"
```

#### 2. Configure Project

```
Framework Preset: Next.js (auto-detected)
Root Directory: ./
Build Command: next build
Output Directory: .next
Install Command: npm install
```

#### 3. Set Environment Variables

Go to **Settings → Environment Variables → Production**

Add all variables from `.env.production.example`:

**Required** (11 variables):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
CREEM_API_KEY
CREEM_ENV=live
CREEM_PRODUCT_ID_BASIC
CREEM_PRODUCT_ID_PRO
CREEM_PRODUCT_ID_STARTER
CREEM_WEBHOOK_SECRET_LIVE
```

**Recommended** (4 variables):
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
BILLING_ENABLED=1
APP_URL=https://fuyouai.com
```

**⚠️ Never Set in Production**:
```
❌ NEXT_PUBLIC_DEV_MODE
❌ NEXT_PUBLIC_INVITE_ENABLED=false
```

#### 4. Deploy

```
Click "Deploy"
Wait 2-3 minutes for build
Verify deployment succeeded (green "Ready" status)
```

#### 5. Set Production Domain

```
Settings → Domains → Add Domain
Enter: fuyouai.com
Follow DNS configuration instructions
```

#### 6. Configure Webhook

In Creem Dashboard:
```
URL: https://fuyouai.com/api/webhook/creem
Events: Select all subscription and checkout events
Environment: Production
```

### Verification

After deployment, test:

```bash
# 1. Health check
curl https://fuyouai.com/api/webhook/creem
# Expected: {"ok":true,"message":"creem webhook endpoint alive"}

# 2. Invite code flow
# Visit: https://fuyouai.com/modules/core?invite=FUYOU-BETA01
# Should show "Sign In Required" (not direct access)

# 3. Core modules
# Login → Upload file → Use voice input → Generate output
```

### Troubleshooting

**Build fails:**
- Check Vercel build logs for errors
- Ensure all dependencies are in `package.json`
- Verify TypeScript types are correct

**Runtime errors:**
- Check Function logs in Vercel Dashboard
- Verify all environment variables are set
- Check Supabase database tables exist

**Webhook not working:**
- Verify `CREEM_WEBHOOK_SECRET_LIVE` matches Creem Dashboard
- Check webhook signature validation in logs
- Ensure `CREEM_ENV=live` is set correctly

---

## 📚 API Reference

### Core Framework Execution

**Endpoint**: `POST /api/core/run`

**Headers**:
```
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

**Request**:
```json
{
  "engineKey": "task_breakdown",
  "userInput": "Build a mobile app for task management",
  "tier": "basic",
  "engineType": "deepseek"
}
```

**Response** (Server-Sent Events):
```
data: {"type":"token","token":"##"}
data: {"type":"token","token":" Task"}
...
data: {"type":"done"}
```

**Error Responses**:
- `401` - Not authenticated
- `402` - Subscription required/expired
- `400` - Missing engineKey or userInput
- `500` - Engine execution error

---

### Universal Module Execution

**Endpoint**: `POST /api/generate`

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
  "output": "Generated content...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 300,
    "total_tokens": 450
  }
}
```

---

### Invite Code Validation

**Endpoint**: `POST /api/invite/validate`

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
  "channel": "official",
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

---

### Invite Code Status

**Endpoint**: `GET /api/invite/status`

**Response (Active Trial)**:
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

---

### Subscription Status

**Endpoint**: `GET /api/subscription`

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
  }
}
```

---

## 🛠️ Development Guide

### Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/fuyouai-promptos.git
cd fuyouai-promptos
npm install

# 2. Set up environment
cp .env.production.example .env.local

# Edit .env.local:
# - Add Supabase credentials
# - Add DeepSeek API key
# - Set NEXT_PUBLIC_DEV_MODE=true (bypass gates)

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

### Developer Mode

Enable developer mode for local testing:

```bash
# .env.local
NEXT_PUBLIC_DEV_MODE=true
```

**Features**:
- ✅ Bypass InviteGate (no invite code needed)
- ✅ Bypass RequirePlan (no subscription needed)
- ✅ Show DEV control panel on Core Methodologies
- ✅ Manual tier/engine switching
- ✅ Subscription status debugging

**⚠️ Never enable in production!**

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (2 spaces, single quotes)
- **Naming**: camelCase for functions, PascalCase for components
- **File structure**: Feature-based grouping

---

## 🐛 Troubleshooting

### Issue: "AI returned empty response"

**Cause**: Response parsing error in ModuleRunner

**Solution**:
```typescript
// ModuleRunner.tsx line 286
const output = res.output ?? "";  // Not res.modelOutput
```

---

### Issue: Invite code users can't access modules

**Cause**: `guard.ts` not checking `invite_code_usage` table

**Solution**: Ensure `guard.ts` Step 3c is implemented (check invite_code_usage with expiry validation)

---

### Issue: Trial expired but user still has access

**Cause**: `used_at` timestamp is null

**Solution**:
```sql
UPDATE invite_code_usage
SET used_at = created_at
WHERE user_id = 'USER-UUID' AND used_at IS NULL;
```

---

### Issue: Webhook signature verification fails

**Cause**: Wrong webhook secret or environment mismatch

**Solution**:
1. Verify `CREEM_ENV=live` in Vercel
2. Use `CREEM_WEBHOOK_SECRET_LIVE` (not `CREEM_WEBHOOK_SECRET`)
3. Check Creem Dashboard for correct secret

---

### Issue: Redis connection fails

**Expected**: System automatically falls back to direct DB queries

**Verification**:
```bash
# Check logs for:
[entitlement_cache] redis get failed, fallback to DB
```

**Performance impact**: Minimal (50-100ms slower per request)

---

## 📖 Architecture Decisions

### Why No Subscription Row for Invite Users?

**Decision**: Invite code validation records usage in `invite_code_usage` but does NOT create a subscription row.

**Rationale**:
1. **Separation of Concerns**: Paid subscriptions vs. trial access have different lifecycles
2. **Simpler Expiry Logic**: Calculate `used_at + 15 days` dynamically
3. **No Overwrites**: Avoids accidentally overwriting existing paid subscriptions
4. **Cleaner Data**: `subscriptions` table only contains real payment records

**Implementation**:
- `guard.ts` checks 3 sources: subscriptions → user_entitlements → invite_code_usage
- `SubscriptionContext` synthesizes virtual subscription for UI consistency
- Expiry calculated on-the-fly in both `/api/invite/status` and `guard.ts`

---

### Why Synthesize Subscription in SubscriptionContext?

**Decision**: When invite code is valid, synthesize `{plan:"basic", status:"active"}` in SubscriptionContext.

**Rationale**:
1. **UI Consistency**: All components use `useSubscription()` expecting a subscription object
2. **No Refactoring**: Avoids rewriting RequirePlan, status indicators, and other UI
3. **Type Safety**: TypeScript types remain consistent across paid/invite users
4. **Feature Parity**: Invite users get same UI experience as basic plan subscribers

**Trade-off**: Client state doesn't match database, but API guard ensures backend validation.

---

### Why Redis Caching for Entitlements?

**Decision**: Use Upstash Redis to cache entitlement checks with 120s TTL.

**Rationale**:
1. **Performance**: Avoid Supabase queries on every API call (especially streaming)
2. **Cost**: Reduce Supabase read operations for high-frequency users
3. **Graceful Degradation**: Falls back to direct DB if Redis unavailable
4. **Busting**: Cache invalidated on subscription changes (webhook, invite validation)

**Implementation**:
- `getEntitlement(userId)` → Try Redis first, fall back to DB
- `setEntitlement(userId, {allowed, code})` → Write to Redis with 120s TTL
- `bustEntitlement(userId)` → Delete Redis key immediately

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Documentation**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/fuyouai-promptos/issues)
- **Email**: support@fuyouai.com

---

## 🎯 Roadmap

- [ ] Multi-language support (i18n)
- [ ] Custom prompt templates
- [ ] Team collaboration features
- [ ] API rate limiting
- [ ] Advanced analytics dashboard
- [ ] Claude/GPT-4 integration
- [ ] Browser extension

---

**Built with ❤️ by the FuyouAI Team**

**Version**: 1.0.0
**Last Updated**: January 2025
