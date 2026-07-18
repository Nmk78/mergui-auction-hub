# MERGUI Auction Hub — Project Progress

Last updated: 2026-07-18

## Current status

All eight MVP development phases are complete.

## Completed milestones

### Phase 1 — Project foundation

- Bootstrapped Next.js 16.2 with React 19.2 and strict TypeScript.
- Initialized Tailwind CSS 4 and Radix-based shadcn/ui owned component sources.
- Established the three-color enterprise design system: deep marine primary,
  neutral surfaces, and restrained amber accent.
- Bundled Geist Sans and Geist Mono locally for deterministic production builds.
- Added responsive seller and buyer workspace shells with sidebar, top
  navigation, mobile sheet navigation, headings, and reusable primitives.
- Added login and buyer-registration flows backed by Convex Auth password
  authentication, with a clearly labelled unconfigured showcase fallback.
- Added Next.js authentication proxy routing for seller and buyer workspaces.
- Defined the complete Convex schema for users/auth, profiles, wallets, batches,
  assessments, auctions, bids, transactions, and activity logs.
- Added role-aware backend authorization helpers. Protected operations will
  revalidate permissions inside Convex and do not rely on route proxy checks.
- Added buyer profile and wallet initialization.
- Documented environment and local startup requirements.
- Verified: `npm run lint`, `npm run typecheck`, and `npm run build`.

### Phase 2 — Batch management

- Added seller-owned batch create, read, update, and delete operations.
- Added shared input rules for names, seafood categories, quantities, weights,
  dates, ports, and descriptions.
- Enforced batch ownership in every protected Convex operation.
- Prevented edits and deletion after a batch enters auction or sold state.
- Added Convex file-storage upload URL generation and image attachment.
- Enforced image MIME type, 10 MB per-file limit, 8-image batch limit, and
  duplicate attachment protection.
- Added safe image removal and storage cleanup.
- Invalidated prior AI assessments whenever batch facts or photos change.
- Added responsive seller batch cards, empty/loading/error states, create and
  edit forms, image previews, detail view, workflow tracker, and destructive
  confirmations.
- Added local showcase batch fixtures that are clearly separated from the live
  Convex data path.
- Verified: `npm run lint`, `npm run typecheck`, and `npm run build`.

### Phase 3 — AI integration

- Added a replaceable OpenRouter service adapter with deployment-only API keys,
  timeouts, normalized errors, and no browser secret exposure.
- Added configurable hosted vision and assistant model names.
- Added multi-image visual assessment through OpenRouter's multimodal chat API.
- Required a strict structured-output JSON schema and a second Zod validation
  pass before any model result is stored.
- Added quality score, decision-support grade, confidence, freshness,
  appearance, color, visible damage, size consistency, issue list, summary,
  trading recommendation, starting bid, market estimate, export estimate, and
  price explanation.
- Added pending/completed/failed assessment state transitions with safe batch
  rollback on service failure.
- Added the professional seller assessment report, metric progress, price cards,
  visible issue states, processing state, error recovery, and model metadata.
- Added the mandatory AI Visual Assessment disclaimer throughout the workflow;
  no result is represented as scientific or official certification.
- Added a grounded AI seafood assistant that receives only stored batch and
  assessment data and explicitly refuses unavailable facts.
- Added deterministic showcase assistant answers without pretending to call a
  live model.
- Verified: `npm run lint`, `npm run typecheck`, and `npm run build`.

### Phase 4 — Timed auctions

- Added seller publication for assessed, ready batches with validated integer MMK
  starting price, minimum increment, start time, and end time.
- Added durable Convex schedules for auction opening and automatic closing.
- Added atomic bid insertion and highest-bid state updates with backend role,
  ownership, status, deadline, and minimum-increment checks.
- Added an idempotent internal close operation that sorts by highest amount and
  earliest server timestamp, records the winner and winning bid, updates the
  batch to sold, and preserves no-bid results.
- Added seller auction history queries and buyer purchase query foundation.
- Added public auction hydration with images, AI report, seller, current price,
  winner, and bid timeline.
- Added auction publication form with AI pricing context and automatic-close
  explanation.
- Added public live auction cards, functional countdowns, detail view, complete
  AI visual report, guest restrictions, buyer bid form, leading state, and bid
  timeline.
- Added seller auction monitoring route.
- Verified: `npm run lint`, `npm run typecheck`, and `npm run build`.

### Phase 5 — Wallet safety and settlement

- Added buyer wallet queries for balance, reserved funds, available funds, and
  transaction history.
- Enforced server-side available-balance checks for every bid.
- Added atomic reservation transfers when a new bidder takes the lead, including
  release and hold transaction records.
- Preserved a buyer's existing reservation when they raise their own leading bid.
- Settled completed auctions atomically by releasing the winning reservation and
  debiting the buyer's balance without permitting a negative wallet.
- Added the buyer wallet dashboard with balance, reserved, and available totals,
  a transaction ledger, loading/empty/error states, and the virtual-wallet
  disclaimer.
- Added available-balance context and insufficient-funds feedback to the bidding
  flow.
- Added an internal-only wallet seed operation; there is no buyer top-up or
  payment interface.
- Verified: `npm run lint`, `npm run typecheck`, and `npm run build`.

### Phase 6 — Guest and buyer experience

- Added live and upcoming marketplace views with functional seafood-type,
  seller, port, and batch-name search.
- Added result counts, no-match guidance, and responsive filters for guest
  browsing.
- Preserved public access to batch facts, seller identity, auction pricing,
  submitted imagery, and complete AI visual assessment reports.
- Added a role-protected buyer bid-history query that consolidates each buyer's
  highest bid per auction and reports leading, outbid, won, or closed state.
- Added the responsive My Bids workspace with direct auction navigation.
- Added the role-protected buyer purchase-history query and responsive purchase
  records with winning price, lot facts, close date, and report navigation.
- Added representative upcoming, bid-history, and purchase showcase states when
  Convex is intentionally unconfigured.
- Verified: `npm run lint`, `npm run typecheck`, and `npm run build`.

### Phase 7 — Seller analytics and records

- Added a role-protected seller analytics query derived from owned batches,
  assessments, auctions, bids, winning buyers, and settled prices.
- Replaced placeholder dashboard values with active inventory, ready batches,
  live auctions, bid volume, rolling 30-day sales, completed lots, and average
  AI visual quality.
- Added a responsive batch-pipeline view and recent-sales summary.
- Added searchable, status-filterable batch history across draft, assessment,
  ready, auction, and sold states.
- Added a complete seller sales-history route with buyer, close date, weight,
  bid count, visual quality, and winning-price records.
- Added loading and empty states plus representative showcase analytics for an
  intentionally unconfigured Convex environment.
- Verified: `npm run lint`, `npm run typecheck`, and `npm run build`.

### Phase 8 — Production hardening and verification

- Added global loading, error-recovery, and not-found route experiences.
- Added the public AI visual assessment methodology and limitations page.
- Wired public header search, upcoming-auction navigation, mobile navigation,
  and purposeful workspace header actions; removed inert controls.
- Added real workspace identity rendering for configured accounts and explicit
  showcase identity in local showcase mode.
- Added an internal seller-provisioning operation without exposing public seller
  registration or an admin surface.
- Fixed buyer self-raise availability so an existing auction hold can be reused,
  and added an optimistic Convex bid and wallet update for responsive feedback.
- Extracted deterministic auction and wallet rules into a reusable domain module.
- Added seven automated tests covering opening bids, increments, deterministic
  tie resolution, reusable reservations, safe settlement, and integer money.
- Added associated form labels, a skip link, mobile public navigation, responsive
  tables/cards, and no-overflow behavior at tested breakpoints.
- Browser-verified public search and upcoming filters, auction reports, guest
  restrictions, buyer registration and bidding, buyer wallet/bids/purchases,
  seller analytics/batches/publication/sales, guidance, and recovery pages.
- Browser verification found no framework overlays or console errors.
- Verified: `npm run lint`, `npm run typecheck`, `npm test`, and
  `npm run build`.

## Pending phases

None for the v1 MVP specification.

## Assumptions

- Seller accounts are provisioned by the business and receive seller profiles
  through an internal seeding operation; public registration creates buyers
  only.
- Buyer wallet funding is performed outside the product and seeded directly in
  Convex. No top-up interface or payment integration will be added.
- AI results are decision support and must always carry the visual-assessment
  disclaimer.
- The OpenRouter vision model is replaceable through deployment configuration;
  the frontend does not depend on a specific model.

## Technical decisions

- Financial values are stored as integer MMK amounts.
- Wallets track both total balance and reserved funds so concurrent leading bids
  cannot overcommit a buyer. The balance is debited only when an auction closes.
- Auction closure will use a durable Convex scheduled internal mutation.
- Domain mutations write activity records for auditability.
- Public and authenticated screens can render without secrets; live mutations
  are only available when Convex is configured.
