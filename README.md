# Dean Shi — Personal Page

[![License: MIT](https://img.shields.io/:license-mit-blue.svg)](LICENSE.md)
[![Netlify Status](https://api.netlify.com/api/v1/badges/313cf600-915b-4cf8-a9b8-a073bdfbf2ed/deploy-status)](https://app.netlify.com/sites/deanshi/deploys)

Personal website for [deanshi.com](https://deanshi.com) — a deep-space engineering console built with vanilla HTML, CSS, and JavaScript. No framework, no bundler.

## Tech

- **Build** — Node.js + [EJS](https://ejs.co/) template rendering, ~20-line custom build script
- **CSS** — Vanilla CSS with custom properties, inlined at build time
- **JS** — Vanilla JS: canvas starfield, IntersectionObserver reveals, 3D tilt, count-up animations
- **Fonts** — Space Grotesk + JetBrains Mono (Google Fonts)
- **Icons** — [Devicon](https://devicon.dev/)

## Getting started

Requires Node.js ≥ 22.

```sh
git clone https://github.com/dnshi/www.git && cd www
npm install
npm run build
npm start
# open http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Render EJS template → `dist/index.html`, copy OG image |
| `npm start` | Serve `dist/` locally via `npx serve` |
| `npm run clean` | Remove `dist/` |

## Project structure

```
src/
  index.html   EJS template
  main.css     Styles (inlined at build time)
  config.json  All resume data — edit this to update content
  og.svg       Social sharing card (1200×630)
scripts/
  build.js     Build script
dist/          Generated output (git-ignored)
legacySite/    Archive of the previous gulp/stylus version
```

## Updating content

All resume data lives in [`src/config.json`](src/config.json) — experience, skills, education, capabilities. Edit that file and run `npm run build`.

## License

MIT
