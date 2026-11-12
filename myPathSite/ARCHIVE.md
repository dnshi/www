# My Path / Signal Dive archive

This folder preserves the complete interactive personal website as it stood on
November 12, 2026, before restoring the practical console-style homepage.
It includes the chronological milestone narrative, Three.js world, résumé data,
build scripts, TypeScript configuration, dependency lockfile, tests, and docs.

Build and run it independently:

```sh
cd myPathSite
npm ci
npm run build
npm test
npm start
# http://localhost:3000
```

To use another preview port:

```sh
npx serve dist -l 3001
```

Its output and dependencies stay in this folder's `dist/` and `node_modules/`.
The active root website and `consoleSite/` are separate versions.
