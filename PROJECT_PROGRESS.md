# MERGUI Auction Hub — Project Progress

Last updated: 2026-07-18

## Current status

Phases 1 through 4 are complete. Phase 5 is next.

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

## Pending phases

- Phase 5 — Wallet reservation, settlement, and transaction history.
- Phase 6 — Guest/buyer marketplace, search, reports, and purchase history.
- Phase 7 — Seller analytics, batch history, and sales history.
- Phase 8 — Empty/error/loading states, accessibility, responsive QA, and full
  end-to-end verification.

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
