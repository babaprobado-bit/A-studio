# AI Studio External Skill Pack v1.0.0

This pack adds **30 built-in, AI Studio-authored instruction adaptations** to the existing Skill Library. It references 30 upstream projects, but does not copy their source code, install their CLIs, execute their scripts, or grant extra permissions.

## Categories

### Code (6)

- **Karpathy-Inspired Engineering** — Understand existing code before editing. [Source](https://github.com/multica-ai/andrej-karpathy-skills)
- **Matt Pocock Plan Critic** — Turn vague requests into testable plans. [Source](https://github.com/mattpocock/skills)
- **ECC Universal Workflow** — Coordinate plan, test, implement, review, verify, and remember. [Source](https://github.com/affaan-m/ECC)
- **Addy Osmani Production Review** — Review production quality and concrete risks. [Source](https://github.com/addyosmani/agent-skills)
- **Superpowers Development Loop** — Use a staged, testable software-development workflow. [Source](https://github.com/obra/superpowers)
- **Ponytail Simplifier** — Reduce accidental complexity after the feature works. [Source](https://github.com/DietrichGebert/ponytail)

### Research (6)

- **Career Ops Research** — Organize explicitly requested career-support tasks. [Source](https://github.com/career-ops-hq/career-ops)
- **REA Authorized Software Inspection** — Inspect only software the user owns or is authorized to assess. [Source](https://github.com/illumi-ai/REA)
- **Graphify Project Mapper** — Map source modules, symbols, dependencies, and data flow. [Source](https://github.com/Graphify-Labs/graphify)
- **Understand Anything Codebase Explainer** — Explain a codebase by tracing a real execution path. [Source](https://github.com/Egonex-AI/Understand-Anything)
- **Last 30 Days Research** — Investigate recent topics with dates and cited sources. [Source](https://github.com/mvanhorn/last30days-skill)
- **Agent Reach Source Research** — Research public sources through approved connectors. [Source](https://github.com/Panniantong/Agent-Reach)

### Tokens (6)

- **Headroom Context Budget** — Compress context while preserving critical facts. [Source](https://github.com/headroomlabs-ai/headroom)
- **BMAD Product Delivery** — Structure large product work into traceable stages. [Source](https://github.com/bmad-code-org/BMAD-METHOD)
- **Claude-Mem Project Memory** — Preserve only durable and safe project context. [Source](https://github.com/thedotmack/claude-mem)
- **gstack Role-Based Review** — Review work from product, UX, architecture, engineering, release, and QA lenses. [Source](https://github.com/garrytan/gstack)
- **Caveman Token Saver** — Use fewer tokens without losing necessary meaning. [Source](https://github.com/JuliusBrussee/skills)
- **GSD Core Task Slicer** — Break large work into verifiable milestones. [Source](https://github.com/open-gsd/gsd-core)

### Design (6)

- **Taste Visual Direction** — Set a coherent visual direction before building UI. [Source](https://github.com/Leonxlnx/taste-skill)
- **Archify Architecture Diagrams** — Turn verified architecture and flows into diagrams. [Source](https://github.com/tt-a1i/archify)
- **Diagram Design Standards** — Make technical diagrams readable and consistent. [Source](https://github.com/cathrynlavery/diagram-design)
- **Impeccable Interface Audit** — Audit layout, typography, accessibility, responsive behavior, and consistency. [Source](https://github.com/pbakaus/impeccable)
- **UI UX Pro Max Design System** — Translate product requirements into reusable design tokens and patterns. [Source](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- **PPT Master Presentation Builder** — Create an evidence-based, editable presentation. [Source](https://github.com/hugohe3/ppt-master)

### Writing & Video (6)

- **Marketing Skills Content Planner** — Create platform-aware content briefs and story hooks. [Source](https://github.com/coreyhaines31/marketingskills)
- **Anthropic Skills Document Workflow** — Handle supplied documents while preserving structure and meaning. [Source](https://github.com/anthropics/skills)
- **OpenMontage Video Pipeline** — Plan a multi-stage video production pipeline. [Source](https://github.com/OpenMontageInc/OpenMontage)
- **Humanizer Natural Writing** — Make text clearer and more natural without changing its meaning. [Source](https://github.com/blader/humanizer)
- **HyperFrames Scene Builder** — Design timed HTML/CSS/JS scenes for video rendering. [Source](https://github.com/hyperframes/hyperframes)
- **Divergent Ideation** — Generate varied ideas, cluster duplicates, and rank candidates. [Source](https://github.com/UditAkhourii/adhd)

## Runtime behavior

- The 30 entries are merged into `SKILL_CATALOG`; together with the 40 existing entries the catalogue contains 70.
- Each entry has a stable `ext-*` ID, Skill Library group, stage (`plan`, `code`, `review`, or `all`), source URL, and review metadata.
- Existing selection limits and stage context limits remain unchanged. A profile can select at most eight Skills at once.
- Existing profiles are not silently replaced or changed.
- Overlap metadata flags entries that should complement existing Skills, not duplicate them.

## Important boundaries

- These are original, concise instruction adaptations, not official upstream skill files.
- Upstream code is not bundled; the license of any upstream repository is not transferred to these summaries. Audit each repository before copying or installing implementation code.
- Shell commands, hooks, network access, MCP connections, file writes, publishing, and deployment require supported tools and explicit user authorization.
- REA is restricted to software the user owns or is authorized to inspect.
- Last 30 Days and Agent Reach require approved online search/connectors; they must report unavailable when offline.
- OpenMontage requires AGPL-3.0 review before incorporating its code. OpenMontage and HyperFrames cards do not include a video renderer.
- Career Ops and PPT Master are optional, non-core Skills.
- Divergent Ideation is a creative workflow, not medical advice or diagnosis.

## Verification

Run `npm run test:skills`. Tests check total catalogue size, exact pack size, six entries per category, unique IDs, valid stages, source URLs, and metadata boundaries, alongside existing import and backup regression tests.
