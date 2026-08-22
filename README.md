# AI Creator Hub

AI Creator Hub is an all-in-one platform for online creators: sell digital products, courses, memberships, and bundles; run email campaigns, funnels, and affiliate programs; manage a customer community and bookings; and use built-in AI (Groq-powered, RAG-backed) to generate content, chat with customers, and run specialized business agents — all from a single creator dashboard, with a public storefront and customer portal for buyers.

## Features

### Commerce
- **Products, Bundles & Memberships** — Sell one-off digital products, bundles of products, and recurring memberships/subscriptions.
- **Checkout & Orders** — Cart-based and direct checkout flows, coupon codes, and order tracking.
- **Payments** — Stripe integration with webhook handling for real payments, and an automatic **simulated payment mode** (`PAYMENT_MODE=simulate`, or auto-detected when no valid Stripe key is configured) so the whole commerce flow works out of the box in development.
- **Secure File Delivery** — Token-gated download links for purchased product files (`/api/commerce/download/:orderId/:token`).
- **Coupons & Affiliates** — Discount codes and an affiliate program with per-affiliate tracking.

### Courses & Community
- **Courses & Lessons** — Structured courses with lessons (including PDF lesson attachments) and learner progress tracking.
- **Enrollments** — Buyer enrollment records tied to orders, with a learning API for progress updates.
- **Community Feed** — Posts (announcements, discussions, wins) with likes/comments, plus creator and customer notification feeds.

### Marketing & Growth
- **Campaigns** — Email campaigns sent to contacts via `nodemailer` (or logged to console as a stub when SMTP isn't configured).
- **Funnels** — Multi-step funnels (landing → lead capture → checkout → upsell → thank you) served publicly by slug, with conversion and lead-capture tracking.
- **Automations** — Trigger-based automations (new subscriber, new customer, new sale, booking confirmed).
- **Contacts & Analytics** — A CRM-style contact list with purchase history, plus page-view analytics and an overview dashboard.
- **Appointments/Bookings** — Session booking with creator confirmation and customer email notifications (join links, confirmations).

### AI Studio (Groq + RAG)
- **Knowledge Base** — Upload text or PDFs (parsed via `pdf-parse`) as a creator's private knowledge base, automatically chunked for retrieval.
- **Retrieval-Augmented Chat** — A lightweight keyword-scoring retriever (`services/rag.js`) pulls relevant knowledge chunks into the LLM prompt so answers are grounded in the creator's own content.
- **AI Assistant & Support Chat** — General assistant and customer-support chat, with conversation history persisted per creator.
- **Specialized Business Agents** — Purpose-built agent personas (`content`, `marketing`, `sales`, `support`, `analytics`, `advisor`), each with its own system prompt, all backed by the same RAG context.
- **AI Content Generators** — One-shot generation endpoints for marketing content, product descriptions, website copy, and branding ideas.
- All AI features run on Groq's OpenAI-compatible API (`llama-3.3-70b-versatile` by default) via the `openai` SDK pointed at Groq's base URL.

### Platform & Access
- **Three Access Roles**: `creator` (the main dashboard user), `admin` (platform-wide oversight), and `customer` (buyers, via passwordless email login codes).
- **Public Storefront** — Each creator gets a public store at their own slug (`/api/storefront/:slug`), listing products/courses/memberships for purchase without an account.
- **Customer Portal** — Passwordless login (email + one-time code) giving buyers access to their purchased products, course progress, and notifications ("My Library").
- **Admin Dashboard** — Platform-wide view over users, products, orders, campaigns, posts, and courses, with moderation actions (update/delete).
- **Creator Branding** — Store profile and branding settings creators can customize and apply to their public storefront.

## Tech Stack

**Backend**
- Node.js (native `--watch` for dev, no nodemon dependency needed for `dev` beyond what's listed), Express
- MongoDB + Mongoose
- JWT auth (`jsonwebtoken`) for creators/admins and a separate customer JWT flow
- Zod for request validation
- Stripe SDK for payments + webhooks
- `openai` SDK configured against Groq's API for all AI features
- `pdf-parse` for extracting text from uploaded PDFs (lesson attachments, knowledge base docs)
- `nodemailer` for transactional and campaign email (falls back to console logging without SMTP config)
- `multer` for file uploads (product files, lesson PDFs, knowledge PDFs)
- `helmet`, `express-rate-limit`, `cors` for baseline API hardening

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Zustand for app/theme state
- Lucide React icons
- Single-page app with in-app view switching (creator dashboard, admin dashboard, public storefront, public funnel, customer portal) rather than a router library

## Project Structure

```
Creator-Hub/
├── server/
│   └── src/
│       ├── server.js                  # Express app bootstrap, route mounting, Stripe webhook route
│       ├── middleware/
│       │   ├── auth.js                # requireAuth (JWT), requireRole
│       │   ├── creator.js             # requireCreator (blocks admin accounts from creator routes)
│       │   └── customerAuth.js        # requireCustomerAuth + customer JWT issuance
│       ├── models/                    # User, Product, Bundle, Course, Enrollment, Membership,
│       │                              #   Subscription, Order, Coupon, Affiliate, Campaign, Contact,
│       │                              #   Appointment, Funnel, Automation, Post, Notification,
│       │                              #   CustomerNotification, CustomerLoginCode, KnowledgeDocument,
│       │                              #   AiConversation, PageView
│       ├── routes/
│       │   ├── auth.js                # Creator/admin register & login
│       │   ├── customer.js            # Passwordless customer login, library, progress, notifications
│       │   ├── products.js / bundles.js / coupons.js
│       │   ├── commerce.js            # Checkout, cart checkout, orders, Stripe webhook handler, downloads
│       │   ├── storefront.js          # Public store, funnel pages, booking, coupon validation, support
│       │   ├── learning.js            # Enrollments & lesson progress
│       │   ├── community.js           # Posts & creator notifications
│       │   ├── campaigns.js / contacts.js / automations.js / affiliates.js / funnels.js
│       │   ├── appointments.js        # Bookings & confirmations
│       │   ├── analytics.js           # Page views & overview stats
│       │   ├── knowledge.js           # Knowledge base CRUD, PDF ingestion
│       │   ├── ai.js / aiStudio.js / aiGenerators.js  # AI chat, agents, and content generators
│       │   ├── settings.js            # Creator profile & branding
│       │   ├── uploads.js             # Product file / lesson PDF uploads
│       │   └── admin.js               # Platform-wide admin views & moderation
│       └── services/
│           ├── groq.js                # Groq client/model config (OpenAI SDK, Groq base URL)
│           ├── rag.js                 # Knowledge chunking + keyword-scored retrieval
│           ├── payments.js            # Simulated vs. real Stripe payment mode detection
│           ├── email.js               # Transactional/campaign email via nodemailer (or console stub)
│           ├── notifications.js       # Creator notification creation
│           ├── customerNotifications.js # Customer notification + email creation
│           └── pdf.js                 # PDF text extraction (pdf-parse)
└── client/
    └── src/
        ├── main.jsx                   # App shell, nav config, top-level view switching
        ├── pages/
        │   ├── OverviewPanel.jsx, ProductPanel.jsx, CommercePanel.jsx, LearningPanel.jsx
        │   ├── GrowthPanel.jsx, FunnelPanel.jsx, AutomationPanel.jsx, AffiliatePanel.jsx
        │   ├── BundlePanel.jsx, AiPanel.jsx, SettingsPanel.jsx
        │   ├── AdminApp.jsx / AdminPanel.jsx           # Admin dashboard
        │   ├── PublicStore.jsx / PublicFunnel.jsx      # Public-facing storefront & funnel pages
        │   ├── CustomerPortal.jsx / MyPurchases.jsx    # Customer-facing library
        │   └── LandingPage.jsx
        ├── components/                # DashboardLayout, ThemeToggle/ThemeSync, shared UI primitives
        ├── store/useAppStore.js       # Zustand app state (auth/theme)
        └── lib/api.js                 # API client wrapper
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local instance or Atlas cluster)
- (Optional) Groq API key for AI features
- (Optional) Stripe account for real payments — otherwise payments run in simulated mode automatically
- (Optional) SMTP credentials for real email delivery — otherwise emails are logged to the console

### 1. Clone the repository

```bash
git clone https://github.com/Mehulposh/Creator-Hub.git
cd Creator-Hub
```

### 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-creator-hub
CLIENT_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:5000

JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=you@example.com     # this email is auto-assigned the admin role on registration

# AI (Groq) — optional; AI routes return a clear error if unset
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# Payments — optional; defaults to simulated mode if unset or invalid
PAYMENT_MODE=                  # "stripe" | "simulate" (auto-detected if left blank)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email — optional; falls back to console logging if unset
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@creatorhub.app
```

Start the backend:

```bash
npm run dev     # node --watch
# or
npm start
```

The API listens at `http://localhost:5000`, with a health check at `GET /api/health`.

### 3. Frontend setup

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Overview

| Area | Route prefix | Notes |
|---|---|---|
| Auth | `/api/auth` | Creator/admin register & login |
| Customer Auth | `/api/customer` | Passwordless login (email code), library, progress, notifications |
| Products / Bundles / Coupons | `/api/products`, `/api/bundles`, `/api/coupons` | Creator-managed catalog |
| Commerce | `/api/commerce` | Checkout, cart checkout, orders, payment mode, gated downloads; webhook is mounted separately at `/api/commerce/webhook` with raw body parsing |
| Storefront | `/api/storefront` | Public store pages by slug, funnels, bookings, coupon validation, support chat |
| Learning | `/api/learning` | Enrollments & lesson progress |
| Community | `/api/community` | Posts & creator notifications |
| Campaigns / Contacts / Automations / Affiliates / Funnels | respective prefixes | Marketing & growth tooling |
| Appointments | `/api/appointments` | Booking management & confirmation |
| Analytics | `/api/analytics` | Page views & overview metrics |
| Knowledge | `/api/knowledge` | Knowledge base CRUD + PDF ingestion for RAG |
| AI | `/api/ai`, `/api/ai-studio`, `/api/ai-generators` | Chat, support chat, business agents, content/product/website/branding generators |
| Settings | `/api/settings` | Creator profile & branding |
| Uploads | `/api/uploads` | Product files, lesson PDFs, knowledge PDFs |
| Admin | `/api/admin` | Platform-wide oversight (requires `admin` role) |

Creator/admin routes require a JWT via `requireAuth` (and `requireRole`/`requireCreator` where applicable); customer routes require a separate customer JWT via `requireCustomerAuth`; storefront routes are public.

## Notes on Optional Integrations

The app is designed to run fully in development with zero external services configured:

- No `GROQ_API_KEY` → AI endpoints return a clear "AI is not configured" error rather than crashing; non-AI features are unaffected.
- No/invalid `STRIPE_SECRET_KEY` → checkout automatically runs in **simulated payment mode**, completing orders without a real charge.
- No `SMTP_HOST` → emails (campaigns, customer notifications, booking confirmations) are logged to the console instead of sent.

For production use, configure Groq, Stripe (including the webhook secret for `/api/commerce/webhook`), and SMTP credentials.

## License

No license file is currently included in this repository. Add one (e.g. MIT) if you intend for others to reuse this code.
