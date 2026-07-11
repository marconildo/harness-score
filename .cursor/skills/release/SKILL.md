---
name: release
description: Use when the user asks to release, publish, or version-bump harness-score — covers the npm package, the Cursor plugin, and the docs, in the right order.
---

# Releasing harness-score

1. Verify green: `npm test`, `npm run lint`, `npm run scan` (must be L4),
   `npm run docs:build`.
2. Bump versions **together**:
   - `packages/cli/package.json`, `TOOL_VERSION` in
     `packages/cli/src/score.ts`, and `version` in `packages/cli/jsr.json`
   - `plugin/.cursor-plugin/plugin.json` (+ entry in `plugin/CHANGELOG.md`)
     — only if plugin content changed, it has its own release track
3. Commit `release: vX.Y.Z`, tag `vX.Y.Z`, push with tags.
4. Create a GitHub Release from that tag (`gh release create vX.Y.Z --generate-notes`)
   — this fires `.github/workflows/release.yml`, which publishes to:
   - **npmjs.org** as `harness-score` (needs the `NPM_TOKEN` repo secret —
     an npm "Automation" token, so it bypasses the 2FA/OTP prompt in CI; the
     user creates and sets this, not you)
   - **GitHub Packages** as `@paladini/harness-score` (automatic, uses the
     built-in `GITHUB_TOKEN`, no secret needed)
   - **JSR** as `@paladini/harness-score` (automatic via OIDC, no secret
     needed — but the scope must be claimed once by the user at jsr.io/new
     before the first publish succeeds)
5. If npm publish must happen before the CI secret exists, the user runs
   `npm publish -w harness-score` locally and approves the OTP in their
   browser — this step cannot be automated by an agent.
6. Marketplace: the plugin updates from the repo — remind the user to
   resubmit at https://cursor.com/marketplace/publish only if plugin
   metadata changed.
7. Docs deploy automatically via `.github/workflows/pages.yml` on push to
   main.
