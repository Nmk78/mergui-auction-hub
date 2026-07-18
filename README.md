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

## Environment

Browser environment:

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`

Convex deployment environment:

- `JWT_PRIVATE_KEY`
- `JWKS`
- `OPENROUTER_API_KEY`
- `OPENROUTER_VISION_MODEL`
- `OPENROUTER_ASSISTANT_MODEL`

Never expose model or authentication secrets with a `NEXT_PUBLIC_` prefix.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

The AI report is always presented as an **AI Visual Assessment**, never as an
official certification.
