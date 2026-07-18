# MERGUI Auction Hub — Project Progress

Last updated: 2026-07-18

## Current status

Phases 1 and 2 are complete. Phase 3 is next.

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

## Pending phases

- Phase 3 — AI visual assessment, price prediction, report explanation, and
  grounded seafood assistant.
- Phase 4 — Timed auction publishing, bidding, deterministic close, and winner.
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
