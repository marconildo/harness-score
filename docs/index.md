---
layout: home

hero:
  name: Harness Score
  text: Harness engineering for Cursor repositories
  tagline: Learn to build the guides, sensors, and guardrails that make AI-assisted development reliable — then measure your repository's maturity with one deterministic command.
  actions:
    - theme: brand
      text: Read the Guide
      link: /guide/what-is-harness-engineering
    - theme: alt
      text: Scan your repo
      link: /guide/measure-and-improve
    - theme: alt
      text: GitHub
      link: https://github.com/paladini/harness-score

features:
  - icon: 🧭
    title: Guides — steer before the agent acts
    details: AGENTS.md, scoped Cursor rules, skills, and commands that put the right context in front of the model at the right time.
  - icon: 📡
    title: Sensors — verify after the agent acts
    details: Tests, linters, type checkers, CI, and Cursor hooks that catch mistakes automatically and let the agent self-correct.
  - icon: 🛡️
    title: Guardrails — make failure impossible
    details: Gate hooks on shell and MCP execution, secret hygiene, and safe defaults that hold even when everything else fails.
  - icon: 📏
    title: A maturity model you can measure
    details: Five levels, six dimensions, thirty-three deterministic checks. `npx harness-score` — no LLM calls, no network, no telemetry.
  - icon: 🏷️
    title: Badges you can show off
    details: Branded SVG badges and banner cards for every level (L0–L4). Wire the scanner into CI once and your README badge updates itself — free, no shields.io.
---

## One command, zero AI

```bash
npx harness-score
```

The scanner reads your filesystem, applies the same rubric documented in the
[Maturity Model](/guide/maturity-model), and tells you exactly what to improve —
every finding links back to a remediation recipe in this guide. It never calls
a model, so results are reproducible in CI, in pre-commit, or inside Cursor via
the **Harness Score** plugin.
