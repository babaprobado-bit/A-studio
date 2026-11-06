import assert from 'node:assert/strict';
import {
  REA_COMPANION_LIMITS,
  REA_COMPANION_OPERATIONS,
  REA_COMPANION_READ_SCOPE,
  isAllowedCompanionOrigin,
  validateAnalysisRequest,
  validatePairRequest
} from '../src/rea-companion-contract.js';

const pair = validatePairRequest({
  code: '482951', clientName: 'AI Studio Desktop', requestedScopes: [REA_COMPANION_READ_SCOPE]
});
assert.equal(pair.ok, true);
assert.deepEqual(pair.value.requestedScopes, ['rea.read']);
assert.equal(validatePairRequest({ code: '12345', clientName: 'AI Studio', requestedScopes: ['rea.read'] }).ok, false);
assert.equal(validatePairRequest({ code: '123456', clientName: 'AI Studio', requestedScopes: ['rea.read', 'rea.write'] }).error.code, 'SCOPE_DENIED');
assert.equal(validatePairRequest({ code: '123456', clientName: 'AI Studio', requestedScopes: ['rea.read'], extra: true }).ok, false);
assert.equal(validatePairRequest({ code: '123456', clientName: 'AI\nStudio', requestedScopes: ['rea.read'] }).ok, false);

const base = {
  requestId: 'test-request-0001', projectId: 'project_1234567890abcdef',
  operation: 'files.inspect', target: { paths: ['src/main.js', 'src/ai-team.js'] },
  question: 'Inspect the selected files and summarize their responsibilities.'
};
const valid = validateAnalysisRequest(base);
assert.equal(valid.ok, true);
assert.deepEqual(valid.value.limits, {
  maxResultBytes: REA_COMPANION_LIMITS.defaultResultBytes,
  timeoutMs: REA_COMPANION_LIMITS.defaultTimeoutMs
});
assert.equal(validateAnalysisRequest({ ...base, operation: 'project.overview', target: {} }).ok, true);
assert.equal(validateAnalysisRequest({ ...base, operation: 'symbols.search', target: { query: 'symbolName' } }).ok, true);
assert.equal(validateAnalysisRequest({ ...base, operation: 'tools.call' }).error.code, 'OPERATION_NOT_ALLOWED');
assert.equal(validateAnalysisRequest({ ...base, shell: 'echo unsafe' }).ok, false);
assert.equal(validateAnalysisRequest({ ...base, projectId: '/home/user/project' }).error.code, 'INVALID_PROJECT_ID');
assert.equal(validateAnalysisRequest({ ...base, question: '   ' }).error.code, 'INVALID_QUESTION');
assert.equal(validateAnalysisRequest({ ...base, question: 'x'.repeat(4001) }).error.code, 'INVALID_QUESTION');

for (const unsafePath of [
  '../secret.txt', '/etc/passwd', 'C:\\Windows\\win.ini', '\\\\server\\share\\file',
  '%2e%2e/secret', 'src//main.js', 'src/./main.js', 'src/\nmain.js'
]) {
  assert.equal(validateAnalysisRequest({ ...base, target: { paths: [unsafePath] } }).error.code, 'PATH_REJECTED');
}
assert.equal(validateAnalysisRequest({ ...base, target: { paths: ['same.js', 'same.js'] } }).error.code, 'DUPLICATE_PATH');
assert.equal(validateAnalysisRequest({ ...base, target: { paths: Array.from({ length: 51 }, (_, i) => String(i) + '.js') } }).error.code, 'INVALID_PATHS');
assert.equal(validateAnalysisRequest({ ...base, target: { paths: ['x'.repeat(513)] } }).error.code, 'PATH_REJECTED');
assert.equal(validateAnalysisRequest({ ...base, target: { paths: ['src/main.js'], extra: true } }).error.code, 'INVALID_TARGET');
assert.equal(validateAnalysisRequest({ ...base, limits: { maxResultBytes: 1048577 } }).error.code, 'LIMIT_EXCEEDED');
assert.equal(validateAnalysisRequest({ ...base, limits: { timeoutMs: 120001 } }).error.code, 'LIMIT_EXCEEDED');
assert.equal(validateAnalysisRequest({ ...base, limits: { timeoutMs: 30000, runShell: true } }).error.code, 'INVALID_LIMITS');
assert.deepEqual(REA_COMPANION_OPERATIONS, ['project.overview', 'files.inspect', 'symbols.search']);

const origin = 'http://localhost:4173';
assert.equal(isAllowedCompanionOrigin(origin, [origin]), true);
assert.equal(isAllowedCompanionOrigin(origin, ['http://localhost:5173']), false);
assert.equal(isAllowedCompanionOrigin('null', ['null']), false);
assert.equal(isAllowedCompanionOrigin(origin, ['*']), false);
assert.equal(isAllowedCompanionOrigin(origin + '/', [origin + '/']), false);
assert.equal(isAllowedCompanionOrigin('javascript:alert(1)', ['javascript:alert(1)']), false);

console.log('REA Companion contract validator tests passed (pure/mock-only; no REA or network connection).');
