// AI Studio-authored instruction adaptations referencing 30 external projects.
// Upstream repositories are not copied, installed, or executed by this module.
export const EXTERNAL_SKILL_PACK_VERSION = '1.0.0';
export const EXTERNAL_SKILL_PACK = Object.freeze([
  {
    "id": "ext-karpathy-principles",
    "name": "Karpathy-Inspired Engineering",
    "group": "Code",
    "stage": "plan",
    "description": "Understand existing code before editing.",
    "content": "Read before writing. State assumptions, map the smallest affected path, and choose the smallest coherent change. Preserve working behavior, avoid speculative abstractions and dependencies, and include edge cases. Verify with focused tests and inspect their output. This is an AI Studio-authored adaptation inspired by public engineering guidance, not an official or verbatim upstream skill file.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/multica-ai/andrej-karpathy-skills",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:karpathy-guidelines",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-matt-pocock-planning",
    "name": "Matt Pocock Plan Critic",
    "group": "Code",
    "stage": "plan",
    "description": "Turn vague requests into testable plans.",
    "content": "Translate the request into acceptance criteria. Challenge vague terms, hidden assumptions, missing edge cases, and unclear ownership of state. Produce a short plan naming affected files, interfaces, risks, and tests. Ask one blocking question only when a missing fact would make the result unsafe or materially wrong; otherwise state the assumption and proceed.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/mattpocock/skills",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-ecc-universal-workflow",
    "name": "ECC Universal Workflow",
    "group": "Code",
    "stage": "all",
    "description": "Coordinate plan, test, implement, review, verify, and remember.",
    "content": "Run a disciplined loop: inspect context, plan, implement, run focused tests, review the diff, verify the final state, and record durable project context. Apply only the relevant stages. Do not copy the full ECC harness or installer into the Android app. Hooks, shell commands, MCP servers, network access, and file writes remain unavailable unless the host explicitly exposes and authorizes them. This is an original workflow summary, not the upstream installer.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/affaan-m/ECC",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:superpowers,review;requires:tool-audit",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-addy-osmani-production-review",
    "name": "Addy Osmani Production Review",
    "group": "Code",
    "stage": "review",
    "description": "Review production quality and concrete risks.",
    "content": "Review correctness, readable structure, failure handling, accessibility, performance, security, observability, and maintainability. Trace the affected user journey and data flow. Report evidence-linked findings ranked by impact, and suggest targeted fixes. Do not manufacture issues or recommend a broad rewrite when a focused patch is sufficient.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/addyosmani/agent-skills",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:superpowers-review",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-superpowers-development-loop",
    "name": "Superpowers Development Loop",
    "group": "Code",
    "stage": "all",
    "description": "Use a staged, testable software-development workflow.",
    "content": "Clarify the goal, explore the codebase, design a small implementation, create a task checklist, implement in testable increments, diagnose failures from evidence, and review the result. Keep planning, implementation, and review distinct. Reuse the existing AI Studio Superpowers skills when they already cover a step; this entry is a workflow index, not a duplicate implementation of every upstream skill.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/obra/superpowers",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:sp-*",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-ponytail-simplifier",
    "name": "Ponytail Simplifier",
    "group": "Code",
    "stage": "code",
    "description": "Reduce accidental complexity after the feature works.",
    "content": "Inspect for unused branches, redundant state, duplicate helpers, speculative abstractions, and unnecessary dependencies. Remove complexity only when behavior remains unchanged. Prefer the simplest readable design that meets acceptance criteria. Keep the diff narrow and prove simplification with existing tests.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/DietrichGebert/ponytail",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:cv-simple-solution,sp-minimal-diff",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-career-ops-research",
    "name": "Career Ops Research",
    "group": "Research",
    "stage": "plan",
    "description": "Organize explicitly requested career-support tasks.",
    "content": "When asked for career support, organize supplied role descriptions, experience notes, application requirements, and interview topics into a traceable plan. Separate user-provided facts from suggestions; never invent qualifications or employment history. Do not send personal information to external services without explicit permission. This is an optional general-purpose skill, not an AI Studio core workflow.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/career-ops-hq/career-ops",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "optional:career-domain",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-rea-authorized-inspection",
    "name": "REA Authorized Software Inspection",
    "group": "Research",
    "stage": "review",
    "description": "Inspect only software the user owns or is authorized to assess.",
    "content": "For authorized software, map observable behavior, public interfaces, package structure, and documented protocols. Build an evidence-linked feature inventory. Do not bypass access controls, extract secrets, defeat licensing, or inspect private third-party systems without permission. Treat binaries and scripts as untrusted; require static inspection and sandbox review before execution.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/illumi-ai/REA",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "requires:explicit-authorization,sandbox-review",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-graphify-project-map",
    "name": "Graphify Project Mapper",
    "group": "Research",
    "stage": "plan",
    "description": "Map source modules, symbols, dependencies, and data flow.",
    "content": "Build a project knowledge graph from available source, docs, configuration, and tests. Represent modules, symbols, imports, API boundaries, stores, and execution paths as relationships. Cite files supporting each edge, mark unknowns, and update only the affected subgraph after changes. Never infer a dependency from naming similarity alone.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/Graphify-Labs/graphify",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:codebase-mapper",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-understand-anything-explainer",
    "name": "Understand Anything Codebase Explainer",
    "group": "Research",
    "stage": "plan",
    "description": "Explain a codebase by tracing a real execution path.",
    "content": "Trace an end-to-end path from entry point through state, services, persistence, and UI. Explain it in plain language and cite exact files or symbols. Separate confirmed behavior from likely intent. When context is incomplete, name the missing file or test instead of inventing architecture.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/Egonex-AI/Understand-Anything",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:codebase-mapper",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-last-30-days-research",
    "name": "Last 30 Days Research",
    "group": "Research",
    "stage": "plan",
    "description": "Investigate recent topics with dates and cited sources.",
    "content": "For user-requested current research, search sources published or updated in the last 30 days. Record publication date and event date separately, compare independent sources, prefer primary evidence, and link each important claim. State the exact time window and limitations. Without search access, mark research unavailable instead of filling gaps from memory.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/mvanhorn/last30days-skill",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "requires:web-or-connected-search",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-agent-reach-source-research",
    "name": "Agent Reach Source Research",
    "group": "Research",
    "stage": "plan",
    "description": "Research public sources through approved connectors.",
    "content": "Use approved tools for publicly accessible web pages, GitHub, Reddit, or public video metadata. Track source URLs and retrieval dates, compare claims, and summarize evidence. Respect platform rules, account permissions, rate limits, and copyright. Never use cookies, credentials, or private account data beyond the user's explicit authorization.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/Panniantong/Agent-Reach",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "requires:approved-connectors",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-headroom-context-budget",
    "name": "Headroom Context Budget",
    "group": "Tokens",
    "stage": "all",
    "description": "Compress context while preserving critical facts.",
    "content": "Prioritize current requirements, relevant code, recent errors, API contracts, and acceptance tests. Summarize repetitive logs and remove unrelated history. Preserve exact error lines, identifiers, version numbers, and source references. Report omissions and never compress away safety constraints or user requirements.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/headroomlabs-ai/headroom",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:model-context",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-bmad-product-delivery",
    "name": "BMAD Product Delivery",
    "group": "Tokens",
    "stage": "plan",
    "description": "Structure large product work into traceable stages.",
    "content": "Define the product goal, user stories, architecture decisions, implementation tasks, and validation. Use roles as review perspectives, not agents with extra permissions. Trace every requirement to a task and test. Keep the plan proportional and avoid duplicating AI Studio's existing AI Team functions.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/bmad-code-org/BMAD-METHOD",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:ai-team",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-claude-mem-project-memory",
    "name": "Claude-Mem Project Memory",
    "group": "Tokens",
    "stage": "all",
    "description": "Preserve only durable and safe project context.",
    "content": "Carry forward durable project facts: branch and commit, accepted decisions, constraints, completed work, unresolved risks, and next steps. Separate facts from proposals and include a source or timestamp when useful. Never save secrets, credentials, sensitive personal data, or unnecessary conversation details. Honor requests to update or remove saved project notes.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/thedotmack/claude-mem",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:shared-vault,notion",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-gstack-role-review",
    "name": "gstack Role-Based Review",
    "group": "Tokens",
    "stage": "review",
    "description": "Review work from product, UX, architecture, engineering, release, and QA lenses.",
    "content": "Use distinct review perspectives: product value, user experience, architecture, implementation quality, release readiness, and QA. Each perspective must provide evidence and concrete findings. Merge duplicates into one prioritized action list. Role labels do not grant repository, network, publishing, or deployment permissions.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/garrytan/gstack",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:ai-team,review",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-caveman-token-saver",
    "name": "Caveman Token Saver",
    "group": "Tokens",
    "stage": "all",
    "description": "Use fewer tokens without losing necessary meaning.",
    "content": "Use compact language and the shortest sufficient context. Prefer clear names, small functions, direct explanations, and focused diffs. Keep critical details, warnings, citations, and test results when shortening. Never turn a limitation into an unsupported success claim. Existing Caveman skills remain authoritative where they overlap.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/JuliusBrussee/skills",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:caveman",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-gsd-core-task-slicer",
    "name": "GSD Core Task Slicer",
    "group": "Tokens",
    "stage": "plan",
    "description": "Break large work into verifiable milestones.",
    "content": "Convert a large goal into small independent milestones. Each task names files, dependencies, expected behavior, acceptance checks, and completion evidence. Keep active context limited to the current milestone while preserving the global plan. Do not report a task complete until its checks have run.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/open-gsd/gsd-core",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:incremental-planner",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-taste-visual-direction",
    "name": "Taste Visual Direction",
    "group": "Design",
    "stage": "plan",
    "description": "Set a coherent visual direction before building UI.",
    "content": "Define audience, purpose, hierarchy, typography, spacing, color roles, density, and motion before producing UI. Apply the system consistently across screens. Prefer clear states and accessible contrast over decoration. Evaluate the rendered interface rather than claiming visual quality from markup alone.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/Leonxlnx/taste-skill",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-archify-architecture-diagrams",
    "name": "Archify Architecture Diagrams",
    "group": "Design",
    "stage": "all",
    "description": "Turn verified architecture and flows into diagrams.",
    "content": "Create diagrams with labeled components, data flow, boundaries, and dependency direction. Map every node and edge to evidence in code or docs. Mark unknowns and external systems explicitly. Keep diagrams maintainable and update them when architecture changes.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/tt-a1i/archify",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:graphify",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-diagram-design-visual-standards",
    "name": "Diagram Design Standards",
    "group": "Design",
    "stage": "all",
    "description": "Make technical diagrams readable and consistent.",
    "content": "Use a clear reading direction, consistent shapes, concise labels, meaningful grouping, and restrained emphasis. Add a legend when symbols are not obvious. Avoid crossing connectors and keep diagrams readable at mobile width and in grayscale.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/cathrynlavery/diagram-design",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:archify",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-impeccable-interface-audit",
    "name": "Impeccable Interface Audit",
    "group": "Design",
    "stage": "review",
    "description": "Audit layout, typography, accessibility, responsive behavior, and consistency.",
    "content": "Check hierarchy, alignment, spacing, typography, contrast, focus states, responsive behavior, and consistency. Report visible or source-verifiable issues with their component and a specific fix. Preserve the product identity and avoid unrelated redesign. Include keyboard and accessibility checks where applicable.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/pbakaus/impeccable",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:ui-ux-pro-max",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-ui-ux-pro-max-design-system",
    "name": "UI UX Pro Max Design System",
    "group": "Design",
    "stage": "plan",
    "description": "Translate product requirements into reusable design tokens and patterns.",
    "content": "Define component patterns, spacing scale, typography roles, color tokens, interaction states, and responsive rules. Match the system to the product and platform. Reuse current tokens and components first. Suggestions remain proposals until implemented and visually checked.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:taste,impeccable",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-ppt-master-presentation",
    "name": "PPT Master Presentation Builder",
    "group": "Design",
    "stage": "all",
    "description": "Create an evidence-based, editable presentation.",
    "content": "Build a slide narrative from the supplied objective and evidence. Give each slide one message, use consistent layouts and readable text, and use charts only when supported by data. Preserve sources for factual claims, avoid invented metrics, and keep the deck editable. Optional document output, not core chat behavior.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/hugohe3/ppt-master",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "optional:presentation-output",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-marketing-skills-content",
    "name": "Marketing Skills Content Planner",
    "group": "Writing & Video",
    "stage": "plan",
    "description": "Create platform-aware content briefs and story hooks.",
    "content": "Build a brief from audience, goal, platform, topic, and format. Separate factual claims from positioning, propose a clear hook and useful payoff, and adapt length to the destination. Avoid fake testimonials, invented statistics, and misleading urgency. Keep What If, In My Town, and Clips as separate formats.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/coreyhaines31/marketingskills",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "overlap:creator-studio",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-anthropic-skills-document-work",
    "name": "Anthropic Skills Document Workflow",
    "group": "Writing & Video",
    "stage": "all",
    "description": "Handle supplied documents while preserving structure and meaning.",
    "content": "Identify the file type and intended output first. Preserve tables, formulas, headings, and source meaning where possible. Validate generated output by reopening or inspecting it. Never claim a file was edited or converted unless the operation succeeded. Audit each upstream skill and its license before adopting implementation code.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/anthropics/skills",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "requires:document-tooling",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-openmontage-video-pipeline",
    "name": "OpenMontage Video Pipeline",
    "group": "Writing & Video",
    "stage": "all",
    "description": "Plan a multi-stage video production pipeline.",
    "content": "Plan ordered scenes, script, source assets, narration, captions, transitions, and render validation. Keep an input/output manifest and require review before publication. This card documents a workflow only; it does not bundle the upstream renderer. The upstream repository is AGPL-3.0, requiring license and deployment review before code reuse.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/OpenMontageInc/OpenMontage",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "requires:license-review,video-renderer",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-humanizer-natural-writing",
    "name": "Humanizer Natural Writing",
    "group": "Writing & Video",
    "stage": "all",
    "description": "Make text clearer and more natural without changing its meaning.",
    "content": "Remove empty phrases, repetitive transitions, generic claims, and unnecessary formality while preserving the author's voice. Do not add facts or experiences that were not supplied. This is an editing skill, not a detector-evasion or authorship-misrepresentation tool.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/blader/humanizer",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-hyperframes-scene-builder",
    "name": "HyperFrames Scene Builder",
    "group": "Writing & Video",
    "stage": "all",
    "description": "Design timed HTML/CSS/JS scenes for video rendering.",
    "content": "Specify scene dimensions, duration, typography, motion, and asset references. Keep scenes deterministic and reusable; validate timing, rendering, and audio synchronization. This instruction card does not include the upstream render engine. A compatible renderer and its runtime requirements must be installed and tested separately.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/hyperframes/hyperframes",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "requires:video-renderer",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  },
  {
    "id": "ext-adhd-divergent-ideation",
    "name": "Divergent Ideation",
    "group": "Writing & Video",
    "stage": "plan",
    "description": "Generate varied ideas, cluster duplicates, and rank candidates.",
    "content": "Generate different creative directions independently, then cluster similar ideas and rank them by originality, audience value, feasibility, and testability. Include one unusual and one low-effort direction. Avoid repeating the same idea with different wording. This is a creative ideation workflow, not a medical or diagnostic tool.",
    "source": "AI Studio External Skill Pack (original adaptation; upstream project is a reference)",
    "sourceUrl": "https://github.com/UditAkhourii/adhd",
    "version": "1.0.0",
    "builtIn": true,
    "metadata": {
      "pack": "external-skill-pack-v1",
      "integrationMode": "prompt-instruction-adaptation",
      "upstreamCodeIncluded": "false",
      "installRequired": "false",
      "overlap": "",
      "reviewStatus": "adapted-not-upstream-implementation"
    }
  }
]);
