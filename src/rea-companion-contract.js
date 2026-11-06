export const REA_PROTOCOL_VERSION = '1';
export const REA_READ_SCOPE = 'rea.read';

export const REA_ALLOWED_OPERATIONS = Object.freeze([
  'project.overview',
  'files.inspect',
  'symbols.search'
]);

export const REA_LIMITS = Object.freeze({
  maxRequestBytes: 1024 * 1024,
  maxPaths: 50,
  maxPathLength: 512,
  maxQuestionLength: 4000,
  maxQuestionBytes: 16000,
  maxResultBytes: 1024 * 1024,
  maxTimeoutMs: 120000,
  defaultTimeoutMs: 30000
});

const ERROR_CODES = new Set([
  'PAIRING_REQUIRED', 'PAIRING_EXPIRED', 'PAIRING_INVALID', 'PAIRING_RATE_LIMITED',
  'PAIRING_CODE_USED', 'HOST_APPROVAL_REQUIRED', 'SESSION_EXPIRED', 'SESSION_REVOKED',
  'SCOPE_DENIED', 'ORIGIN_REJECTED', 'PROJECT_NOT_REGISTERED', 'PATH_REJECTED',
  'OPERATION_NOT_ALLOWED', 'REQUEST_REPLAYED', 'USER_APPROVAL_REQUIRED',
  'PROVIDER_FORWARDING_DISABLED', 'LIMIT_EXCEEDED', 'REA_UNAVAILABLE', 'TIMEOUT',
  'INTERNAL_ERROR'
]);

const isRecord = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const hasExactKeys = (value, allowed, required = allowed) => {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.every(key => allowed.includes(key)) &&
    required.every(key => Object.prototype.hasOwnProperty.call(value, key));
};

const utf8ByteLength = value => new TextEncoder().encode(value).byteLength;
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;
const isOpaqueId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);
const isUuid = value => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function validateRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 ||
      value.length > REA_LIMITS.maxPathLength) return false;
  if (value.startsWith('/') || value.startsWith('\\') ||
      value.includes('\\') || value.includes('%') || value.includes(':') ||
      /[\u0000-\u001f\u007f]/.test(value)) return false;
  const segments = value.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) return false;
  if (segments.some(segment => /[. ]$/.test(segment))) return false;
  if (segments.some(segment => /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(segment))) return false;
  return true;
}

function validatePathList(paths, selectedPaths, errors, label = 'target.paths') {
  if (!Array.isArray(paths) || paths.length < 1 || paths.length > REA_LIMITS.maxPaths) {
    errors.push(label + ' must contain between 1 and ' + REA_LIMITS.maxPaths + ' selected relative paths');
    return;
  }
  const approved = new Set(Array.isArray(selectedPaths) ? selectedPaths : []);
  const seen = new Set();
  for (const path of paths) {
    if (!validateRelativePath(path)) {
      errors.push(label + ' contains an unsafe relative path');
      continue;
    }
    if (seen.has(path)) errors.push(label + ' contains a duplicate path');
    seen.add(path);
    if (!approved.has(path)) errors.push(label + ' contains a path not explicitly selected for this request');
  }
}

export function validateAnalysisRequest(input, context = {}) {
  const errors = [];
  if (!isRecord(input)) return { ok: false, errors: ['request must be a JSON object'], value: null };
  let encoded;
  try {
    encoded = JSON.stringify(input);
  } catch {
    return { ok: false, errors: ['request must be JSON-serializable'], value: null };
  }
  if (utf8ByteLength(encoded) > REA_LIMITS.maxRequestBytes) {
    return { ok: false, errors: ['request exceeds the maximum body size'], value: null };
  }
  input = JSON.parse(encoded);

  const required = ['requestId', 'projectId', 'operation', 'target', 'question'];
  if (!hasExactKeys(input, ['requestId', 'projectId', 'operation', 'target', 'question', 'limits'], required)) {
    errors.push('request contains missing or unknown fields');
  }
  if (!isUuid(input.requestId)) errors.push('requestId must be a UUID');
  if (!isOpaqueId(input.projectId)) errors.push('projectId must be an opaque identifier');

  const registered = context.registeredProjectIds instanceof Set
    ? context.registeredProjectIds
    : new Set(Array.isArray(context.registeredProjectIds) ? context.registeredProjectIds : []);
  if (isOpaqueId(input.projectId) && !registered.has(input.projectId)) {
    errors.push('projectId is not registered by the companion');
  }
  if (!REA_ALLOWED_OPERATIONS.includes(input.operation)) {
    errors.push('operation is not in the read-only allowlist');
  }
  if (!isNonEmptyString(input.question) ||
      input.question.length > REA_LIMITS.maxQuestionLength ||
      utf8ByteLength(typeof input.question === 'string' ? input.question : '') > REA_LIMITS.maxQuestionBytes) {
    errors.push('question must be non-empty and within the configured length limit');
  }

  const target = input.target;
  if (!isRecord(target)) {
    errors.push('target must be a JSON object');
  } else if (input.operation === 'project.overview') {
    if (!hasExactKeys(target, [])) errors.push('project.overview target must be empty');
  } else if (input.operation === 'files.inspect') {
    if (!hasExactKeys(target, ['paths'])) errors.push('files.inspect target accepts only paths');
    else validatePathList(target.paths, context.explicitlySelectedPaths, errors);
  } else if (input.operation === 'symbols.search') {
    if (!hasExactKeys(target, ['query', 'paths'])) {
      errors.push('symbols.search target requires query and paths only');
    } else {
      if (!isNonEmptyString(target.query) || target.query.length > 200) {
        errors.push('symbols.search query must be 1 to 200 characters');
      }
      validatePathList(target.paths, context.explicitlySelectedPaths, errors, 'target.paths');
    }
  }

  let normalizedLimits = {
    maxResultBytes: REA_LIMITS.maxResultBytes,
    timeoutMs: REA_LIMITS.defaultTimeoutMs
  };
  if (input.limits !== undefined) {
    if (!hasExactKeys(input.limits, ['maxResultBytes', 'timeoutMs'])) {
      errors.push('limits contains missing or unknown fields');
    } else {
      const { maxResultBytes, timeoutMs } = input.limits;
      if (!Number.isInteger(maxResultBytes) || maxResultBytes < 1 ||
          maxResultBytes > REA_LIMITS.maxResultBytes) {
        errors.push('limits.maxResultBytes is outside the allowed range');
      }
      if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 ||
          timeoutMs > REA_LIMITS.maxTimeoutMs) {
        errors.push('limits.timeoutMs is outside the allowed range');
      }
      normalizedLimits = { maxResultBytes, timeoutMs };
    }
  }
  if (errors.length) return { ok: false, errors, value: null };

  return {
    ok: true,
    errors: [],
    value: {
      requestId: input.requestId,
      projectId: input.projectId,
      operation: input.operation,
      target: input.target,
      question: input.question,
      limits: normalizedLimits
    }
  };
}

export function validateAnalysisResponse(input, request) {
  const errors = [];
  if (!isRecord(input)) return { ok: false, errors: ['response must be a JSON object'], value: null };
  if (!hasExactKeys(input, [
    'requestId', 'companionId', 'protocolVersion', 'operation',
    'status', 'result', 'disclosure'
  ])) errors.push('response contains missing or unknown fields');
  if (input.requestId !== request?.requestId) errors.push('response requestId does not match the request');
  if (!isOpaqueId(input.companionId)) errors.push('companionId must be an opaque identifier');
  if (input.protocolVersion !== REA_PROTOCOL_VERSION) errors.push('unsupported protocol version');
  if (input.operation !== request?.operation) errors.push('response operation does not match the request');
  if (input.status !== 'completed') errors.push('response status must be completed');

  if (!hasExactKeys(input.result, ['content']) || typeof input.result.content !== 'string') {
    errors.push('response result must contain only text content');
  } else {
    const maxBytes = Number.isInteger(request?.limits?.maxResultBytes)
      ? request.limits.maxResultBytes
      : REA_LIMITS.maxResultBytes;
    if (utf8ByteLength(input.result.content) > maxBytes) errors.push('response result exceeds the request byte limit');
  }

  if (!hasExactKeys(input.disclosure, ['projectId', 'paths', 'sentToModelProvider'])) {
    errors.push('response disclosure is malformed');
  } else {
    if (input.disclosure.projectId !== request?.projectId) errors.push('response disclosure project does not match the request');
    const expectedPaths = Array.isArray(request?.target?.paths) ? request.target.paths : [];
    if (!Array.isArray(input.disclosure.paths) ||
        JSON.stringify(input.disclosure.paths) !== JSON.stringify(expectedPaths)) {
      errors.push('response disclosure paths do not match the request');
    }
    if (input.disclosure.sentToModelProvider !== false) {
      errors.push('the companion must not forward results to a model provider');
    }
  }
  return errors.length
    ? { ok: false, errors, value: null }
    : { ok: true, errors: [], value: input };
}

export function validateBridgeError(input) {
  const errors = [];
  if (!hasExactKeys(input, ['requestId', 'error']) ||
      !hasExactKeys(input.error, ['code', 'message', 'retryable'])) {
    return { ok: false, errors: ['error response is malformed'], value: null };
  }
  if (input.requestId !== null && input.requestId !== undefined && !isUuid(input.requestId)) {
    errors.push('error requestId must be a UUID or null');
  }
  if (!ERROR_CODES.has(input.error.code)) errors.push('error code is not recognized');
  if (!isNonEmptyString(input.error.message) || input.error.message.length > 240 ||
      /[\r\n]/.test(input.error.message)) errors.push('error message is not sanitized');
  if (typeof input.error.retryable !== 'boolean') errors.push('retryable must be boolean');
  return errors.length
    ? { ok: false, errors, value: null }
    : { ok: true, errors: [], value: input };
}

export function validateBridgeOrigin({ origin, expectedOrigin, host, expectedHost } = {}) {
  if (typeof origin !== 'string' || origin === 'null' ||
      typeof expectedOrigin !== 'string' || origin !== expectedOrigin) return false;
  if (typeof host !== 'string' || typeof expectedHost !== 'string' || host !== expectedHost) return false;
  try {
    const parsed = new URL(origin);
    const hostMatch = /^127\.0\.0\.1:(\d{1,5})$/.exec(host);
    if (!hostMatch) return false;
    const port = Number(hostMatch[1]);
    return parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1' &&
      port >= 1 && port <= 65535 && String(port) === hostMatch[1] &&
      parsed.port === String(port) && parsed.origin === expectedOrigin &&
      parsed.username === '' && parsed.password === '';
  } catch {
    return false;
  }
}