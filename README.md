# MERGUI Auction Hub

AI-powered seafood quality assessment and timed digital auctions for Myeik's
seafood trade.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4 and owned shadcn/ui component sources
- Convex database, file storage, scheduling, and Convex Auth
- OpenRouter for grounded report generation, visual assessment, and assistant
  responses
- Vercel and Convex Cloud production targets

## Local development

```bash
npm install
cp .env.example .env.local
npx convex dev
npm run dev
```

`npx convex dev` provisions the development deployment and writes the public
Convex URL. Complete the Convex Auth key setup described in
[the official setup guide](https://labs.convex.dev/auth/setup) before using live
accounts.

Without `NEXT_PUBLIC_CONVEX_URL`, the interface starts in local showcase mode so
that the product shell and seeded workflows remain reviewable. Showcase mode is
clearly labelled and never impersonates a live backend.

Buyer profiles and zero-balance virtual wallets are created during public buyer
registration. Seller profiles are business-provisioned through the internal
`profiles:provisionSeller` operation; there is intentionally no public seller
registration or admin dashboard in this MVP. Wallet balances are seeded through
the internal `wallets:setSeededBalance` operation.

## Development test users

With `DEBUG_TOOLS_ENABLED=true` on the development deployment, seed two sellers
and three funded buyers with:

```bash
npm run seed:users
```

All seeded accounts use the password `DemoPass123!`:

- Sellers: `seller1@mergui.test`, `seller2@mergui.test`
- Buyers: `buyer1@mergui.test`, `buyer2@mergui.test`, `buyer3@mergui.test`

To repair a test account registered with the wrong role:

```bash
npx convex run seed:assignExistingRole '{"email":"seller3@gmail.com","role":"seller"}'
```

## Environment

Local app environment:

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`
- `NEXT_PUBLIC_DEBUG_TOOLS_ENABLED` (`true` exposes `/debug` in this app)
- `SITE_URL` (`http://localhost:3000` for local development; your deployed app
  origin in production)

Convex deployment environment:

- `SITE_URL`
- `JWT_PRIVATE_KEY`
- `JWKS`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `OPENROUTER_API_KEY`
- `OPENROUTER_VISION_MODEL`
- `OPENROUTER_ASSISTANT_MODEL`
- `AUTO_BIDDING_ENABLED` (`true` to enable demo auto-bidding, otherwise unset
  or `false`)
- `DEBUG_TOOLS_ENABLED` (`true` allows `/debug` cleanup mutations)

Never expose model or authentication secrets with a `NEXT_PUBLIC_` prefix.

For Google sign-in, configure the OAuth app's authorized redirect URI as:

```text
https://<your-convex-site-url>/api/auth/callback/google
```

## Demo auto-bidding

The Convex backend includes an opt-in trading-bot cron for live demos. It uses
a 10-second pulse with random skips and delayed bid bursts, creates clearly
named demo buyer bot profiles if needed, keeps their virtual wallets funded,
and places randomized valid bids on live auctions through the same wallet
reservation path used by real buyers.

Enable it on the active Convex deployment:

```bash
npx convex env set AUTO_BIDDING_ENABLED true
```

Disable it after the demo:

```bash
npx convex env set AUTO_BIDDING_ENABLED false
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The AI report is always presented as an **AI Visual Assessment**, never as an
official certification.
