# Console site archive

This is the complete source of the personal page before the Three.js observatory
redesign, copied from commit `6e0dbf9` on November 12, 2026. The original source,
build script, dependency lockfile, product brief, and documentation are preserved.

To build and view this version independently:

```sh
cd consoleSite
npm ci
npm run build
npm start
```

The generated site is written to this folder's own `dist/` directory. The earlier
Gulp/Stylus page is still preserved separately in `../legacySite/`.
