# Build Scripts

This directory contains build-time scripts for the docs-engine project.

## generateCliScreenshotsSvg.ts

Generates the terminal-style SVG examples under
`static/screenshots/examples/`.

```bash
tsx scripts/generateCliScreenshotsSvg.ts
```

## bumpIfPublished.ts

Checks the npm registry during release and bumps package patch versions when the
local version would collide with a published version.
