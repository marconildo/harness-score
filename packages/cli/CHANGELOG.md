# harness-score

## 0.4.0

### Minor Changes

- 6c7a64b: Migrate the build to tsup (smaller, bundled `dist/`, an explicit `"types"` field and `"types"` export condition), memoize `ctx.matching()` for a measurable scan-time win on large repositories, and add packaging-level type/exports verification (`attw`, a consumer-facing type smoke test) to CI. No public API or output changes — verified against a golden-output regression snapshot and an external-consumer `npm pack` smoke test.
- f3ad4b6: Rename public terminology from "rubric" to **maturity model** (aligned with DORA/SAMM/CMMI framing). Breaking API rename: `ReportDiff.rubricChanged` → `maturityModelChanged`. Issue template `rubric_change.yml` → `check_change.yml`; test `rubric-sync.test.ts` → `maturity-sync.test.ts`.
- b879862: Recognize equivalent AI harness artifacts across Cursor, Windsurf, Claude Code, Codex/Antigravity, OpenCode, Cline, Continue, Copilot instructions, and Zed using OR semantics — a single configured tool is enough to satisfy existing checks without requiring `.cursor/` paths.

### Patch Changes

- f3ad4b6: Reconcile the two plugin generators that collided when #18 and #13 merged: registry-derived path hints now live in the generated `plugins/shared/tool-paths.mjs`, the hand-maintained `plugins/shared/tools.mjs` imports its paths from it, and `npm run plugins:sync-check` (previously shadowed by a duplicate script key) runs both sync gates.
