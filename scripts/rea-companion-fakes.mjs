// Deterministic in-memory fakes for contract tests only.
// These deliberately do NOT provide cryptographic pairing, secure token storage,
// a network listener, filesystem access, a process runner or a real REA adapter.

import { REA_PROTOCOL_VERSION, REA_READ_SCOPE } from '../src/rea-companion-contract.js';

function fakeError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

export class FakePairingSessionStore {
  constructor({
    now = () => 0,
    pairingTtlMs = 120000,
    sessionTtlMs = 900000,
    maxAttempts = 5,
    lockoutMs = 60000,
    makeToken = () => 'mock-session-token-not-cryptographic-000000000000'
  } = {}) {
    this.now = now;
    this.pairingTtlMs = pairingTtlMs;
    this.sessionTtlMs = sessionTtlMs;
    this.maxAttempts = maxAttempts;
    this.lockoutMs = lockoutMs;
    this.makeToken = makeToken;
    this.pendingCodes = new Map();
    this.usedCodes = new Set();
    this.sessions = new Map();
    this.revokedTokens = new Set();
    this.failures = new Map();
  }

  issueCode({ code, clientId = 'test-client', displayName = 'AI Studio', scope = REA_READ_SCOPE } = {}) {
    if (typeof code !== 'string' || !/^[A-Za-z0-9-]{8,32}$/.test(code) ||
        this.pendingCodes.has(code) || this.usedCodes.has(code)) {
      throw fakeError('PAIRING_INVALID');
    }
    if (typeof clientId !== 'string' || clientId.trim().length < 3 || clientId.length > 80) {
      throw fakeError('PAIRING_INVALID');
    }
    this.pendingCodes.set(code, {
      clientId,
      displayName: String(displayName).slice(0, 80),
      scope,
      expiresAt: this.now() + this.pairingTtlMs
    });
    return { code, expiresAt: this.now() + this.pairingTtlMs };
  }

  pair({ code, clientId = 'test-client', scope = REA_READ_SCOPE, hostApproved = false } = {}) {
    const key = typeof clientId === 'string' && clientId.trim() ? clientId : 'anonymous';
    const now = this.now();
    const state = this.failures.get(key) || { attempts: 0, lockedUntil: 0 };
    if (state.lockedUntil > now) throw fakeError('PAIRING_RATE_LIMITED');
    if (state.lockedUntil && state.lockedUntil <= now) {
      state.attempts = 0;
      state.lockedUntil = 0;
    }

    const failAttempt = codeValue => {
      state.attempts += 1;
      if (state.attempts >= this.maxAttempts) state.lockedUntil = now + this.lockoutMs;
      this.failures.set(key, state);
      throw fakeError(codeValue);
    };

    if (typeof code !== 'string') return failAttempt('PAIRING_INVALID');
    if (this.usedCodes.has(code)) return failAttempt('PAIRING_CODE_USED');
    const pending = this.pendingCodes.get(code);
    if (!pending) return failAttempt('PAIRING_INVALID');
    if (pending.expiresAt <= now) {
      this.pendingCodes.delete(code);
      return failAttempt('PAIRING_EXPIRED');
    }
    if (pending.clientId !== key) return failAttempt('PAIRING_INVALID');
    if (scope !== REA_READ_SCOPE || pending.scope !== REA_READ_SCOPE) {
      this.pendingCodes.delete(code);
      this.usedCodes.add(code);
      return failAttempt('SCOPE_DENIED');
    }
    if (hostApproved !== true) {
      this.pendingCodes.delete(code);
      this.usedCodes.add(code);
      return failAttempt('HOST_APPROVAL_REQUIRED');
    }

    this.pendingCodes.delete(code);
    this.usedCodes.add(code);
    const token = this.makeToken();
    if (typeof token !== 'string' || token.length < 32 || this.sessions.has(token)) {
      throw fakeError('INTERNAL_ERROR');
    }
    const session = {
      clientId: pending.clientId,
      displayName: pending.displayName,
      scope: REA_READ_SCOPE,
      expiresAt: now + this.sessionTtlMs
    };
    this.sessions.set(token, session);
    this.failures.delete(key);
    return { sessionToken: token, scope: session.scope, expiresAt: session.expiresAt };
  }

  authenticate(token, requiredScope = REA_READ_SCOPE) {
    if (typeof token !== 'string' || !token) throw fakeError('PAIRING_REQUIRED');
    if (this.revokedTokens.has(token)) throw fakeError('SESSION_REVOKED');
    const session = this.sessions.get(token);
    if (!session) throw fakeError('PAIRING_REQUIRED');
    if (session.expiresAt <= this.now()) {
      this.sessions.delete(token);
      throw fakeError('SESSION_EXPIRED');
    }
    if (session.scope !== requiredScope || requiredScope !== REA_READ_SCOPE) {
      throw fakeError('SCOPE_DENIED');
    }
    return {
      clientId: session.clientId,
      displayName: session.displayName,
      scope: session.scope,
      expiresAt: session.expiresAt
    };
  }

  revoke(token) {
    if (!this.sessions.has(token)) return false;
    this.sessions.delete(token);
    this.revokedTokens.add(token);
    return true;
  }
}

export class FakeReadOnlyAdapter {
  constructor() {
    this.calls = [];
    this.completedRequestIds = new Set();
    this.sideEffectCounts = Object.freeze({
      writes: 0,
      shellExecutions: 0,
      installs: 0,
      launches: 0,
      remoteTasks: 0
    });
  }

  async analyze(request, { userApproved = false, forwardToProvider = false } = {}) {
    if (!userApproved) throw fakeError('USER_APPROVAL_REQUIRED');
    if (forwardToProvider) throw fakeError('PROVIDER_FORWARDING_DISABLED');
    if (this.completedRequestIds.has(request.requestId)) throw fakeError('REQUEST_REPLAYED');

    this.completedRequestIds.add(request.requestId);
    this.calls.push({
      requestId: request.requestId,
      operation: request.operation,
      projectId: request.projectId
    });
    const paths = Array.isArray(request.target?.paths) ? [...request.target.paths] : [];
    return {
      requestId: request.requestId,
      companionId: 'mock-companion-id-0001',
      protocolVersion: REA_PROTOCOL_VERSION,
      operation: request.operation,
      status: 'completed',
      result: { content: 'Mock analysis only. Returned text is untrusted and inert.' },
      disclosure: {
        projectId: request.projectId,
        paths,
        sentToModelProvider: false
      }
    };
  }
}
