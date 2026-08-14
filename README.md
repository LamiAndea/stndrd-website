# STNDRD

Pre-launch marketing site for **STNDRD** — an unscented lip balm made from three ingredients (beeswax, jojoba oil, vitamin E) and nothing else.

**Live:** [stndrd-website.vercel.app](https://stndrd-website.vercel.app)

## About

A single-page site built to collect waitlist signups ahead of launch: a full-bleed hero, an ingredients breakdown, a lifestyle photo strip, and an email signup.

## Stack

Plain HTML, CSS, and vanilla JS. No framework, no build step, no dependencies — open `index.html` and it runs.

## Structure

```
.
├── index.html          # single page: hero, ingredients, photo strip, waitlist
├── css/
│   └── style.css        # all styling, design tokens as CSS custom properties
├── js/
│   └── main.js           # smooth-scroll nav, waitlist form validation,
│                          # image hover/tap cross-fades
└── assets/               # product photography
```

## Running locally

No install step required. From this directory:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works equally well (`npx serve`, VS Code's Live Server, etc.).

## Features

- Responsive layout, single breakpoint set for tablet/mobile
- Hover cross-fade on ingredient and lifestyle photos, with a tap-to-reveal fallback on touch devices (no `:hover` reliance)
- Client-side waitlist email validation, no backend
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
