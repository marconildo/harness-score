---
name: release
description: Use when the user asks to release, publish, or version-bump harness-score — covers the npm package, the Cursor plugin, and the docs, in the right order.
---

# Releasing harness-score

1. Verify green: `npm test`, `npm run lint`, `npm run scan` (must be L4),
   `npm run docs:build`.
2. Bump versions **together**:
   - `packages/cli/package.json` and `TOOL_VERSION` in
     `packages/cli/src/score.ts`
   - `plugin/.cursor-plugin/plugin.json` (+ entry in `plugin/CHANGELOG.md`)
3. Commit `release: vX.Y.Z`, tag `vX.Y.Z`, push with tags.
4. Publish the CLI: `npm publish -w harness-score` (needs `npm login`; the
   user runs this, not you).
5. Marketplace: the plugin updates from the repo — remind the user to
   resubmit at https://cursor.com/marketplace/publish only if plugin
   metadata changed.
6. Docs deploy automatically via `.github/workflows/pages.yml` on push to
   main.
