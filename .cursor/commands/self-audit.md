# /self-audit

Run `npm run scan` from the repository root. This repo must report
**L4 · Self-correcting**.

If it does: reply with the one-line score and stop.

If it does not: list the failed checks and the level gaps verbatim from the
output, identify which recent change regressed the harness (check git diff
for deleted/renamed harness files), and propose the minimal fix. Do not
lower thresholds in `packages/cli/src/score.ts` to make the scan pass.
