export const MAX_SELECTED_SKILLS = 8;
export const MAX_STAGE_SKILL_CHARS = 36000;
export const MAX_IMPORTED_SKILL_CHARS = 12000;
export const SKILL_CATALOG = Object.freeze([
  {
    "id": "sp-clarify",
    "name": "Goal Clarifier",
    "group": "Superpowers",
    "stage": "plan",
    "description": "Turn the request into a testable goal.",
    "content": "Turn the request into a testable goal. List explicit constraints and unknowns. Ask one focused question only when a missing fact blocks safe progress; otherwise state a reasonable assumption.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-codebase-map",
    "name": "Codebase Mapper",
    "group": "Superpowers",
    "stage": "plan",
    "description": "Trace the relevant entry points, modules, data flow, and existing patterns before proposing edits.",
    "content": "Trace the relevant entry points, modules, data flow, and existing patterns before proposing edits. Reuse the current architecture instead of creating a parallel system.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-incremental-plan",
    "name": "Incremental Planner",
    "group": "Superpowers",
    "stage": "plan",
    "description": "Split work into small ordered steps.",
    "content": "Split work into small ordered steps. For each step state the files, dependency, acceptance check, and rollback path. Prefer the smallest useful milestone.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-root-cause",
    "name": "Root Cause Investigator",
    "group": "Superpowers",
    "stage": "review",
    "description": "Separate observed symptoms from hypotheses.",
    "content": "Separate observed symptoms from hypotheses. Trace the failure to a reproducible cause before changing code; do not mask the symptom with unrelated changes.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-reproduce",
    "name": "Reproduce Before Fix",
    "group": "Superpowers",
    "stage": "review",
    "description": "Define a minimal reproduction or regression test before the fix.",
    "content": "Define a minimal reproduction or regression test before the fix. Capture the current behavior and ensure the proposed change addresses that exact failure.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-test-first",
    "name": "Test-First Builder",
    "group": "Superpowers",
    "stage": "code",
    "description": "Write or update a focused test that expresses expected behavior before implementing the smallest change.",
    "content": "Write or update a focused test that expresses expected behavior before implementing the smallest change. Include success, boundary, and failure cases.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-minimal-diff",
    "name": "Minimal Diff",
    "group": "Superpowers",
    "stage": "code",
    "description": "Change only what the requested feature needs.",
    "content": "Change only what the requested feature needs. Avoid broad refactors, formatting churn, dependency changes, or unrelated renames.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-compatibility",
    "name": "Compatibility Guardian",
    "group": "Superpowers",
    "stage": "review",
    "description": "Preserve existing storage keys, APIs, file formats, and user flows.",
    "content": "Preserve existing storage keys, APIs, file formats, and user flows. Add versioned migrations and backward-compatible defaults; never discard older user data silently.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-api-contract",
    "name": "API Contract Designer",
    "group": "Superpowers",
    "stage": "code",
    "description": "Define inputs, outputs, errors, timeouts, and version compatibility before implementation.",
    "content": "Define inputs, outputs, errors, timeouts, and version compatibility before implementation. Validate external responses and keep provider-specific behavior behind adapters.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-assumption-check",
    "name": "Assumption Checker",
    "group": "Superpowers",
    "stage": "plan",
    "description": "Mark assumptions explicitly and verify them against the repository or tests.",
    "content": "Mark assumptions explicitly and verify them against the repository or tests. Never invent files, APIs, dependencies, device capabilities, or successful test results.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-secure-defaults",
    "name": "Secure Defaults",
    "group": "Superpowers",
    "stage": "code",
    "description": "Keep secrets out of source code, logs, exports, and prompts unless explicitly needed.",
    "content": "Keep secrets out of source code, logs, exports, and prompts unless explicitly needed. Use least privilege, validate imported input, and make network sharing opt-in.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-performance-budget",
    "name": "Performance Budget",
    "group": "Superpowers",
    "stage": "code",
    "description": "Consider memory, CPU, storage, startup time, and network cost.",
    "content": "Consider memory, CPU, storage, startup time, and network cost. Bound file sizes, task context, concurrency, and model memory; provide a graceful low-resource path.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-edge-review",
    "name": "Edge-Case Reviewer",
    "group": "Superpowers",
    "stage": "review",
    "description": "Review null, empty, malformed, oversized, offline, interrupted, duplicate, and low-memory cases.",
    "content": "Review null, empty, malformed, oversized, offline, interrupted, duplicate, and low-memory cases. Ensure errors are recoverable and state remains consistent.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-docs-sync",
    "name": "Docs Synchronizer",
    "group": "Superpowers",
    "stage": "review",
    "description": "Update docs when a user-visible capability or limitation changes.",
    "content": "Update docs when a user-visible capability or limitation changes. Distinguish implemented behavior from planned behavior and include configuration and recovery steps.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "sp-release-gate",
    "name": "Release Gate",
    "group": "Superpowers",
    "stage": "review",
    "description": "Before release, run syntax, unit, integration, build, and migration checks available in the environment.",
    "content": "Before release, run syntax, unit, integration, build, and migration checks available in the environment. Report each result separately and list tests not run.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-concise",
    "name": "Short Answer Mode",
    "group": "Caveman",
    "stage": "all",
    "description": "Use short direct sentences.",
    "content": "Use short direct sentences. Remove filler and repeated context. Keep every important requirement, warning, and action.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-plain",
    "name": "Plain Language",
    "group": "Caveman",
    "stage": "all",
    "description": "Prefer everyday language.",
    "content": "Prefer everyday language. Explain technical terms the first time. Avoid unexplained acronyms and marketing claims.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-one-step",
    "name": "One Step at a Time",
    "group": "Caveman",
    "stage": "plan",
    "description": "Give the next concrete step first.",
    "content": "Give the next concrete step first. Break a large task into a small sequence and avoid overwhelming the user with unrelated choices.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-no-guess",
    "name": "No Guessing",
    "group": "Caveman",
    "stage": "all",
    "description": "Do not guess facts.",
    "content": "Do not guess facts. Inspect files or verify with a tool. State what is unknown and what evidence would resolve it.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-example",
    "name": "Show One Example",
    "group": "Caveman",
    "stage": "all",
    "description": "When explaining a new mechanism, show one realistic example that matches the current project.",
    "content": "When explaining a new mechanism, show one realistic example that matches the current project. Avoid several near-identical examples.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-small-steps",
    "name": "Small Steps",
    "group": "Caveman",
    "stage": "code",
    "description": "Prefer small functions and focused edits.",
    "content": "Prefer small functions and focused edits. Make one logical change at a time and keep each step easy to test.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-simple-solution",
    "name": "Simplest Working Design",
    "group": "Caveman",
    "stage": "plan",
    "description": "Choose the least complicated design that meets the actual requirements.",
    "content": "Choose the least complicated design that meets the actual requirements. Add abstractions only when they remove real duplication or risk.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-keep-working",
    "name": "Keep Old Things Working",
    "group": "Caveman",
    "stage": "review",
    "description": "Preserve existing features and data.",
    "content": "Preserve existing features and data. Extend old behavior instead of replacing it. Test the old path after introducing a new path.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-few-deps",
    "name": "Few Dependencies",
    "group": "Caveman",
    "stage": "code",
    "description": "Avoid new packages when the platform or current dependencies already solve the problem.",
    "content": "Avoid new packages when the platform or current dependencies already solve the problem. Explain why each unavoidable dependency is needed.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-small-functions",
    "name": "Small Functions",
    "group": "Caveman",
    "stage": "code",
    "description": "Keep functions focused with clear inputs and outputs.",
    "content": "Keep functions focused with clear inputs and outputs. Separate UI, persistence, network access, parsing, and model execution.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-clear-names",
    "name": "Clear Names",
    "group": "Caveman",
    "stage": "code",
    "description": "Use names that reveal purpose.",
    "content": "Use names that reveal purpose. Avoid cryptic abbreviations, hidden side effects, and overly generic variables.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-tradeoffs",
    "name": "Explain Tradeoffs",
    "group": "Caveman",
    "stage": "plan",
    "description": "State the main benefit, cost, and limitation of the chosen approach in a few lines.",
    "content": "State the main benefit, cost, and limitation of the chosen approach in a few lines. Do not present one choice as perfect.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-confirm-delete",
    "name": "Protect Destructive Actions",
    "group": "Caveman",
    "stage": "code",
    "description": "Confirm before deleting user files, resetting data, overwriting work, or sending costly multi-provider requests.",
    "content": "Confirm before deleting user files, resetting data, overwriting work, or sending costly multi-provider requests. Keep reversible options when possible.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-safe-default",
    "name": "Safe Defaults",
    "group": "Caveman",
    "stage": "code",
    "description": "Start with demo mode, opt-in network sharing, least privilege, and local persistence.",
    "content": "Start with demo mode, opt-in network sharing, least privilege, and local persistence. Never enable a risky behavior silently.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-reuse",
    "name": "Reuse Existing Work",
    "group": "Caveman",
    "stage": "plan",
    "description": "Search the current project for a reusable module, helper, workflow, or dependency before writing a replacement.",
    "content": "Search the current project for a reusable module, helper, workflow, or dependency before writing a replacement.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-honest-tests",
    "name": "Honest Test Report",
    "group": "Caveman",
    "stage": "review",
    "description": "Never say a test passed unless it was actually run and its result was inspected.",
    "content": "Never say a test passed unless it was actually run and its result was inspected. Separate automated, manual, mocked, and untested behavior.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-context-limit",
    "name": "Small Context",
    "group": "Caveman",
    "stage": "code",
    "description": "Send only context needed for the current stage.",
    "content": "Send only context needed for the current stage. Respect explicit token and character limits; prioritize relevant files over entire archives.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-good-errors",
    "name": "Useful Errors",
    "group": "Caveman",
    "stage": "code",
    "description": "Return an actionable error that says what failed and the next safe check.",
    "content": "Return an actionable error that says what failed and the next safe check. Do not swallow errors or expose secrets in messages.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-mvp",
    "name": "MVP First",
    "group": "Caveman",
    "stage": "plan",
    "description": "Build the smallest end-to-end slice first.",
    "content": "Build the smallest end-to-end slice first. Keep optional automation and advanced settings out until the core flow works.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-readable",
    "name": "Readable Code",
    "group": "Caveman",
    "stage": "code",
    "description": "Prefer readable code over clever tricks.",
    "content": "Prefer readable code over clever tricks. Keep control flow obvious and comments focused on why a non-obvious decision exists.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-no-fake",
    "name": "No Fake Features",
    "group": "Caveman",
    "stage": "review",
    "description": "Do not label a stub, mock, template, or remote connection as a real offline model or working integration.",
    "content": "Do not label a stub, mock, template, or remote connection as a real offline model or working integration. Make boundaries visible in the UI.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "cv-final-summary",
    "name": "Clear Handoff",
    "group": "Caveman",
    "stage": "review",
    "description": "Finish with files changed, behavior added, checks run, known limits, and the next actionable step.",
    "content": "Finish with files changed, behavior added, checks run, known limits, and the next actionable step. Keep the summary factual.",
    "source": "AI Studio starter pack",
    "builtIn": true
  },
  {
    "id": "karpathy-guidelines",
    "name": "Karpathy-inspired Coding Guidelines (original summary)",
    "group": "Guidelines",
    "stage": "all",
    "description": "First understand the existing code and its constraints.",
    "content": "First understand the existing code and its constraints. Read before writing; prefer the smallest coherent change; keep the design simple and explicit; avoid unnecessary abstractions and dependencies; preserve working behavior; reason about edge cases; verify with tests; do not claim unrun tests; and explain limitations honestly. This is an AI Studio-authored summary inspired by public software-engineering guidance, not an official or verbatim Karpathy skill file.",
    "source": "AI Studio starter pack",
    "builtIn": true
  }
]);
export const SKILL_PROFILES = Object.freeze({
  "karpathy": {
    "name": "Karpathy Guidelines",
    "description": "Tek temel kalite kuralı.",
    "skillIds": [
      "karpathy-guidelines"
    ]
  },
  "superpowers": {
    "name": "Superpowers",
    "description": "Planlama, araştırma, test ve inceleme.",
    "skillIds": [
      "sp-clarify",
      "sp-codebase-map",
      "sp-incremental-plan",
      "sp-root-cause",
      "sp-test-first",
      "sp-minimal-diff",
      "sp-compatibility",
      "sp-edge-review"
    ]
  },
  "caveman": {
    "name": "Caveman",
    "description": "Kısa, doğrudan ve basit çalışma.",
    "skillIds": [
      "cv-concise",
      "cv-plain",
      "cv-one-step",
      "cv-no-guess",
      "cv-small-steps",
      "cv-simple-solution",
      "cv-keep-working",
      "cv-honest-tests"
    ]
  },
  "balanced": {
    "name": "Dengeli Geliştirme",
    "description": "Genel geliştirme için karışık paket.",
    "skillIds": [
      "karpathy-guidelines",
      "sp-clarify",
      "sp-codebase-map",
      "sp-minimal-diff",
      "sp-test-first",
      "sp-compatibility",
      "cv-concise",
      "cv-no-guess"
    ]
  }
});

function slug(value) {
  return String(value || 'skill').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'skill';
}

export function normalizeSkill(raw, options = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim().slice(0, 100);
  const content = String(raw.content || raw.body || '').trim();
  if (!name || !content || content.length > MAX_IMPORTED_SKILL_CHARS) return null;
  const id = String(raw.id || (options.idPrefix || 'custom') + '-' + slug(name)).slice(0, 100);
  const stage = ['plan','code','review','all'].includes(raw.stage) ? raw.stage : 'all';
  return { id, name, group: String(raw.group || 'Custom').slice(0, 40), stage, description: String(raw.description || '').trim().slice(0, 240), content, source: String(raw.source || 'Imported SKILL.md').slice(0, 160), builtIn: raw.builtIn === true };
}

export function parseSkillMarkdown(markdown, fileName = 'SKILL.md') {
  const source = String(markdown || '').replace(/^\uFEFF/, '').trim();
  if (!source) throw new Error('SKILL.md dosyası boş.');
  if (source.length > 50000) throw new Error('Dosya 50 KB sınırını aşıyor.');
  let header = {}; let body = source;
  if (source.startsWith('---')) {
    const end = source.indexOf('\n---', 3);
    if (end > 0) {
      const front = source.slice(3, end); body = source.slice(end + 4).trim();
      for (const line of front.split(/\r?\n/)) {
        const match = line.match(/^([a-zA-Z_-]+)\s*:\s*(.*)$/);
        if (match) header[match[1].toLowerCase()] = match[2].replace(/^['"]|['"]$/g, '').trim();
      }
    }
  }
  const heading = body.match(/^#\s+(.+)$/m);
  const name = header.name || (heading ? heading[1].trim() : String(fileName).replace(/\.md$/i, '')) || 'Imported Skill';
  const description = header.description || '';
  const stageRaw = String(header.stage || 'all').toLowerCase();
  const stage = ['plan','code','review','all'].includes(stageRaw) ? stageRaw : 'all';
  const content = body.replace(/^#\s+.+\n?/, '').trim();
  if (!content) throw new Error('Skill içeriği bulunamadı.');
  if (content.length > MAX_IMPORTED_SKILL_CHARS) throw new Error('Skill metni 12.000 karakter sınırını aşıyor.');
  return normalizeSkill({ name, description, stage, content, group: 'Custom', source: 'Imported: ' + fileName });
}

export function buildStageSkillContext(skills, stageId, limits = {}) {
  const maxSkills = Math.max(0, Math.min(MAX_SELECTED_SKILLS, Number(limits.maxSkills ?? MAX_SELECTED_SKILLS)));
  const maxChars = Math.max(0, Math.min(MAX_STAGE_SKILL_CHARS, Number(limits.maxChars ?? MAX_STAGE_SKILL_CHARS)));
  const stage = ['plan','code','review'].includes(stageId) ? stageId : 'all';
  const candidates = (Array.isArray(skills) ? skills : []).map(skill => normalizeSkill(skill)).filter(Boolean).filter(skill => skill.stage === 'all' || skill.stage === stage).slice(0, maxSkills);
  const header = '\\n\\n--- AI STUDIO SKILLS (' + stage.toUpperCase() + ') ---\\n';
  const footer = '\\n--- END SKILLS ---';
  const contentBudget = Math.max(0, maxChars - header.length - footer.length);
  const blocks = []; let used = 0; const includedIds = []; const excludedIds = [];
  for (const skill of candidates) {
    const block = '### ' + skill.name + '\\n' + skill.content;
    const remaining = contentBudget - used;
    if (remaining < 100) { excludedIds.push(skill.id); continue; }
    const clipped = block.length > remaining ? block.slice(0, remaining) : block;
    blocks.push(clipped); used += clipped.length; includedIds.push(skill.id);
    if (clipped.length < block.length) { excludedIds.push(skill.id); break; }
  }
  const omittedByCount = (Array.isArray(skills) ? skills.length : 0) > maxSkills;
  const promptText = blocks.length ? header + blocks.join('\\n\\n') + footer : '';
  return { promptText, includedIds, excludedIds, charCount: promptText.length, maxChars, stage, omittedByCount };
}
export function getProfileSkillIds(profileId) {
  return [...(SKILL_PROFILES[profileId]?.skillIds || SKILL_PROFILES.karpathy.skillIds)].slice(0, MAX_SELECTED_SKILLS);
}
