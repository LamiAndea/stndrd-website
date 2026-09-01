# STNDRD — Astro build (archived)

The original STNDRD website, built with Astro and deployed on Vercel.
**Superseded by a Shopify theme**, which is what now runs the live store at
[stndrdhq.com](https://stndrdhq.com) — see
[stndrd-shopify-theme](https://github.com/LamiAndea/stndrd-shopify-theme).

This build is kept online as a working demo and a place to prototype:

- **Live demo:** [stndrd-website.vercel.app](https://stndrd-website.vercel.app)
- `noindex` and `Disallow: /` so it never competes with the real store in
  search. Direct links work normally.
- Checkout runs on **Stripe test mode** — card `4242 4242 4242 4242` with
  any future expiry completes a real test order. It cannot move real money.
- The waitlist form posts to a serverless route backed by Resend.

## Stack

[Astro](https://astro.build) with the Vercel adapter. Static HTML output with a single serverless API route for the waitlist. Images are optimized at build time (AVIF/WebP, responsive widths) via `astro:assets`.

## Structure

```
.
├── src/
│   ├── pages/
│   │   ├── index.astro       # landing: hero, ingredients, photo strip, waitlist
│   │   ├── shop.astro        # product page: gallery, quantity, add to cart
│   │   ├── 404.astro         # branded not-found page
│   │   └── api/waitlist.ts   # serverless signup endpoint (Resend Audiences)
│   ├── components/           # Hero, Ingredients, Strip, header/footer, CrossfadePhoto
│   ├── styles/global.css     # all styling, design tokens as CSS custom properties
│   ├── scripts/main.js       # motion, waitlist form, cross-fades, scroll progress
│   └── assets/               # product photography (optimized at build)
└── public/                   # favicon, og image, robots, sitemap
```

## Running locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build to dist/
```

## Waitlist configuration

Signups are stored as contacts in a [Resend](https://resend.com) Audience. Set two
environment variables (locally in `.env`, and in the Vercel project settings):

```
RESEND_API_KEY=re_...
RESEND_AUDIENCE_ID=...
```

Until they are set, the API returns 503 and the form tells visitors the waitlist
isn't open yet. The form also carries a honeypot field and light per-IP rate limiting.

## Features

- Responsive layout, single breakpoint set for tablet/mobile
- Hover cross-fade on ingredient and lifestyle photos, with a tap-to-reveal fallback on touch devices (no `:hover` reliance)
- Waitlist signup with client validation, a serverless endpoint, honeypot spam protection, and rate limiting
- Semantic markup: real headings, descriptive `alt` text, keyboard-focusable interactive photo cards

## Deployment

Deployed to [Vercel](https://vercel.com) from the `main` branch. To ship a new build:

```bash
vercel deploy --prod
```

## Branches

- `main` — current live version
- `legacy/pre-refresh` — snapshot of the original design (video hero, standalone product section), kept for reference

## Usage

Proprietary — this repository is public so it can be deployed and reviewed easily, not as an invitation to reuse. The STNDRD name, branding, and product photography are not licensed for reuse.
