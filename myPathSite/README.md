# Dean Shi / My Path

A playable personal website for [deanshi.com](https://deanshi.com). Pilot a
luminous signal through four chronological career milestones. No score, collisions,
timers, or failure penalties. The complete HTML résumé is always one click away.

## Build and preview

Requires Node.js >= 22 and npm >= 10.

```sh
npm ci
npm run build
npm start
# http://localhost:3000
```

Rebuild after editing; the server serves generated `dist/` output.

| Command | Description |
| --- | --- |
| `npm run typecheck` | Strict TypeScript validation |
| `npm run build` | Type-check, render EJS, bundle local JavaScript |
| `npm test` | Content, references, asset budget, and route regression tests (build first) |
| `npm start` | Serve production output with `npx serve` |
| `npm run clean` | Remove generated output |

## Play

- **Follow my path** starts at Acadia and the early product teams, then moves
  through Amazon / Microsoft, Amplitude, and Microsoft Fabric.
- Move the pointer to drift; scroll to travel along the light river.
- On touchscreens, drag to steer and swipe upward to move forward.
- **Next chapter**, the dated route markers, and **My path** navigate without dexterity.
- Arrow keys travel between worlds. All controls also support Tab and Enter.
- Arriving automatically illuminates a milestone. The company, dates, capability
  shift, and concrete contribution are visible without opening any details.
- **Details** opens the complete role. The diagrams remain unobstructed; no
  floating game prompt covers their labels.
- **Résumé** provides every role, education, capability, and contact link.
- Escape or **Back to the dive** closes a panel. Chapter URLs support history
  and direct linking.
- **Motion off** freezes ambient animation and makes travel immediate.
  Reduced-motion preferences enable this mode by default.
- Opening any panel or hiding the tab suspends rendering.

## Architecture

Framework-free, statically deployable EJS + TypeScript + Three.js. esbuild bundles
dependencies locally and loads the world in a separate chunk. The scene uses
procedural architecture, instanced buildings, curved filaments, a steerable
signal with a trail, and bloom postprocessing. No external models or textures.
The production build enforces a 1 MiB gzip budget for all JavaScript.

```text
src/
  config.json    Résumé facts, education, social links, toolkit
  exhibit.json   Chronological milestone stories, role membership, and scene labels
  index.html     Game shell and complete, accessible HTML résumé
  main.css       Full-screen HUD, large-type reading panels, mobile and print styles
  main.ts        Game UI, connections, panels, history, evidence, and fallbacks
  scene.ts       Navigable Three.js world, player, effects, and lifecycle
  journey.ts     Route boundaries and nearest-signal navigation
  og.svg         Social preview
scripts/
  build.js       EJS rendering, reference validation, and esbuild code splitting
tests/
  site.test.cjs  Generated-site and route regression tests
../consoleSite/  Independently buildable pre-3D site (outside this archive)
../legacySite/   Earlier Gulp/Stylus page
../epicSite/     Original personal page
```

## Content

Edit [`src/config.json`](src/config.json) to update facts. Chapter IDs derive from
company and start year, for example `microsoft-2026` versus `microsoft-2020`.
Update [`src/exhibit.json`](src/exhibit.json) when renaming a company or changing
a start year. Builds reject invalid references, non-chronological milestones,
duplicate role membership, and experiences missing from the journey.

The worlds express factual capability shifts: device / game / frontend work,
end-to-end delivery and off-main-thread performance, four products unified into
one platform, and Fabric extension / identity / shared-client foundations.
The diagrams are visual metaphors, not actual system blueprints; the four
Amplitude tiles are numbered rather than assigned invented product names.
Personal beliefs and impact metrics are not inferred.

All nine
roles remain readable, including the two separate Microsoft chapters. Evidence
lenses highlight supporting experience without hiding other work.

## Fallbacks and readability

The game never gates contact details or résumé facts. Without JavaScript, the
complete résumé is an ordinary document below the introduction. World chunk
loading, WebGL initialization, render, or context-loss errors show an explicit
message and restore that document. Main reading copy is 18px with responsive
panels, keyboard focus, and print styles. Fonts have system fallbacks.

## Archives

[`consoleSite/ARCHIVE.md`](../consoleSite/ARCHIVE.md) describes the source backup
made before the 3D redesign. Its original manifests and lockfile are unchanged;
its dependencies and build are independent of this version.

## License

[MIT](LICENSE.md)
