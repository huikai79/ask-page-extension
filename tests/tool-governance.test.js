'use strict';

const assert = require('assert');
const {
  GOVERNANCE_MODE,
  EXECUTION_DECISION,
  normalizeGovernanceMode,
  planToolExecution,
  buildToolAuditRecord,
  shouldBlockWithoutApproval
} = require('../lib/tool-governance');

const safePolicy = { risk: 'read-only', requiresExplicitApproval: false };
const riskyPolicy = { risk: 'high-impact', requiresExplicitApproval: true };

assert.strictEqual(normalizeGovernanceMode('anything'), GOVERNANCE_MODE.OBSERVE);
assert.strictEqual(normalizeGovernanceMode('enforce'), GOVERNANCE_MODE.ENFORCE);

assert.deepStrictEqual(
  planToolExecution(safePolicy, { mode: 'enforce' }),
  {
    mode: GOVERNANCE_MODE.ENFORCE,
    decision: EXECUTION_DECISION.ALLOW,
    requiresApproval: false,
    reason: 'policy-allows'
  }
);

const observed = planToolExecution(riskyPolicy, { mode: 'observe' });
assert.strictEqual(observed.decision, EXECUTION_DECISION.ALLOW);
assert.strictEqual(observed.requiresApproval, true);
assert.strictEqual(shouldBlockWithoutApproval(observed), false);

const enforced = planToolExecution(riskyPolicy, { mode: 'enforce' });
assert.strictEqual(enforced.decision, EXECUTION_DECISION.REQUIRE_APPROVAL);
assert.strictEqual(shouldBlockWithoutApproval(enforced), true);

const missing = planToolExecution(null, { mode: 'enforce' });
assert.strictEqual(missing.decision, EXECUTION_DECISION.BLOCK);

const audit = buildToolAuditRecord({
  id: 'call-1',
  name: 'run_js',
  policy: riskyPolicy,
  plan: enforced,
  approval: 'approved',
  outcome: 'executed',
  success: true,
  durationMs: 12
});
assert.strictEqual(audit.version, 1);
assert.strictEqual(audit.toolName, 'run_js');
assert.strictEqual(audit.risk, 'high-impact');
assert.strictEqual(audit.approval, 'approved');
assert.strictEqual(audit.success, true);

console.log('tool-governance.test.js passed');
