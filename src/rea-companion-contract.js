/**
 * Pure validation helpers for the proposed REA Companion protocol.
 * This module intentionally contains no HTTP, MCP, filesystem, process or socket code.
 * It does not connect to, launch, install or invoke REA.
 */

export const REA_COMPANION_PROTOCOL_VERSION = '1';
export const REA_COMPANION_READ_SCOPE = 'rea.read';
export const REA_COMPANION_OPERATIONS = Object.freeze([
  'project.overview',
  'files.inspect',
  'symbols.search'
]);

export const REA_COMPANION_LIMITS = Object.freeze({
  maxPaths: 50,
  maxPathChars: 512,
  maxQuestionChars: 4000,
  maxSearchChars: 2000,
  maxResultBytes: 1024 * 1024,
  defaultResultBytes: 1024 * 1024,
  defaultTimeoutMs: 30_000,
  maxTimeoutMs: 120_000
});

function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every(key => allowed.includes(key));
}

function failure(code, message) {
  return { ok: false, error: { code, message } };
}

function success(value) {
  return { ok: true, value };
}

function boundedString(value, { min = 1, max, trim = true, allowNewlines = false } = {}) {
  if (typeof value !== 'string') return null;
  const normalized = trim ? value.trim() : value;
  if (normalized.length < min || normalized.length > max) return null;
  const controls = allowNewlines
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
    : /[\u0000-\u001F\u007F]/;
  if (controls.test(normalized)) return null;
  return normalized;
}

function validateRelativePath(value) {
  const path = boundedString(value, { min: 1, max: REA_COMPANION_LIMITS.maxPathChars });
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('~')) return null;
  if (path.includes('\\') || path.includes('%') || path.includes(':')) return null;
  if (/^[A-Za-z]:/.test(path)) return null;
  const segments = path.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) return null;
  return path;
}

function validatePaths(value, { optional = false } = {}) {
  if (value === undefined && optional) return success(undefined);
  if (!Array.isArray(value) || value.length < 1 || value.length > REA_COMPANION_LIMITS.maxPaths) {
    return failure('INVALID_PATHS', 'paths must contain between 1 and 50 selected relative paths.');
  }
  const paths = [];
  const seen = new Set();
  for (const item of value) {
    const path = validateRelativePath(item);
    if (!path) return failure('PATH_REJECTED', 'Each path must be a safe, normalized relative path.');
    if (seen.has(path)) return failure('DUPLICATE_PATH', 'Duplicate paths are not allowed.');
    seen.add(path);
    paths.push(path);
  }
  return success(paths);
}

/** Validate the JSON body for POST /v1/pair. Runtime pairing code checks remain host-side. */
export function validatePairRequest(input) {
  if (!isRecord(input) || !hasOnlyKeys(input, ['code', 'clientName', 'requestedScopes'])) {
    return failure('INVALID_PAIR_REQUEST', 'Pair request must be a plain object with only supported fields.');
  }
  if (typeof input.code !== 'string' || !/^\d{6}$/.test(input.code)) {
    return failure('INVALID_PAIRING_CODE', 'Pairing code must be exactly six digits.');
  }
  const clientName = boundedString(input.clientName, { min: 1, max: 64 });
  if (!clientName) return failure('INVALID_CLIENT_NAME', 'Client name must contain 1–64 safe characters.');
  if (!Array.isArray(input.requestedScopes) || input.requestedScopes.length !== 1 || input.requestedScopes[0] !== REA_COMPANION_READ_SCOPE) {
    return failure('SCOPE_DENIED', 'V0 pairing may request only the rea.read scope.');
  }
  return success({
    code: input.code,
    clientName,
    requestedScopes: [REA_COMPANION_READ_SCOPE]
  });
}

/** Validate one allowlisted, read-only POST /v1/analysis request. */
export function validateAnalysisRequest(input) {
  const rootKeys = ['requestId', 'projectId', 'operation', 'target', 'question', 'limits'];
  if (!isRecord(input) || !hasOnlyKeys(input, rootKeys)) {
    return failure('INVALID_REQUEST', 'Analysis request must be a plain object with only supported fields.');
  }

  const requestId = boundedString(input.requestId, { min: 1, max: 128 });
  if (!requestId || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(requestId)) {
    return failure('INVALID_REQUEST_ID', 'requestId contains unsupported characters or has an invalid length.');
  }
  const projectId = boundedString(input.projectId, { min: 16, max: 128 });
  if (!projectId || !/^[A-Za-z0-9_-]+$/.test(projectId)) {
    return failure('INVALID_PROJECT_ID', 'projectId must be an opaque identifier, not a filesystem path.');
  }
  if (!REA_COMPANION_OPERATIONS.includes(input.operation)) {
    return failure('OPERATION_NOT_ALLOWED', 'Only the documented read-only operations are allowed.');
  }
  const question = boundedString(input.question, { min: 1, max: REA_COMPANION_LIMITS.maxQuestionChars, trim: false, allowNewlines: true });
  if (!question || !question.trim()) {
    return failure('INVALID_QUESTION', 'question must contain 1–4000 characters.');
  }
  if (!isRecord(input.target)) return failure('INVALID_TARGET', 'target must be an object.');

  let target;
  if (input.operation === 'project.overview') {
    if (Object.keys(input.target).length !== 0) {
      return failure('INVALID_TARGET', 'project.overview accepts an empty target only.');
    }
    target = {};
  } else if (input.operation === 'files.inspect') {
    if (!hasOnlyKeys(input.target, ['paths'])) {
      return failure('INVALID_TARGET', 'files.inspect accepts only selected paths.');
    }
    const checked = validatePaths(input.target.paths);
    if (!checked.ok) return checked;
    target = { paths: checked.value };
  } else {
    if (!hasOnlyKeys(input.target, ['query', 'paths'])) {
      return failure('INVALID_TARGET', 'symbols.search accepts only query and optional selected paths.');
    }
    const query = boundedString(input.target.query, { min: 1, max: REA_COMPANION_LIMITS.maxSearchChars });
    if (!query) return failure('INVALID_SEARCH_QUERY', 'Search query must contain 1–2000 safe characters.');
    const checked = validatePaths(input.target.paths, { optional: true });
    if (!checked.ok) return checked;
    target = { query, ...(checked.value ? { paths: checked.value } : {}) };
  }

  let limits = {
    maxResultBytes: REA_COMPANION_LIMITS.defaultResultBytes,
    timeoutMs: REA_COMPANION_LIMITS.defaultTimeoutMs
  };
  if (input.limits !== undefined) {
    if (!isRecord(input.limits) || !hasOnlyKeys(input.limits, ['maxResultBytes', 'timeoutMs'])) {
      return failure('INVALID_LIMITS', 'limits may contain only maxResultBytes and timeoutMs.');
    }
    const maxResultBytes = input.limits.maxResultBytes ?? limits.maxResultBytes;
    const timeoutMs = input.limits.timeoutMs ?? Limits.timeoutMs;
    if (!Number.isSafeInteger(maxResultBytes) || maxResultBytes < 1 || maxResultBytes > REA_COMPANION_LIMITS.maxResultBytes) {
      return failure('LIMIT_EXCEEDED', 'maxResultBytes must be between 1 byte and 1 MiB.');
    }
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > REA_COMPANION_LIMITS.maxTimeoutMs) {
      return failure('LIMIT_EXCEEDED', 'timeoutMs must be between 1000 and 120000.');
    }
    limits = { maxResultBytes, timeoutMs };
  }

  return success({ requestId, projectId, operation: input.operation, target, question, limits });
}

/** Exact Origin allowlist check. This is not a replacement for Host/CSRF/DNS-rebinding checks. */
export function isAllowedCompanionOrigin(origin, allowlist) {
  if (typeof origin !== 'string' || origin === 'null' || origin === '*' || !Array.isArray(allowlist)) return false;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) return false;
  return allowlist.some(allowed => typeof allowed === 'string' && allowed !== '*' && allowed !== 'null' && allowed === origin);
}
