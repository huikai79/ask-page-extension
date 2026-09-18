'use strict';

const assert = require('assert');
const {
  TOOL_RISK,
  classifyToolRisk,
  classifyToolCallRisk,
  requiresExplicitApproval,
  buildToolPolicy
} = require('../lib/tool-policy');

assert.strictEqual(classifyToolRisk('read_page'), TOOL_RISK.READ_ONLY);
assert.strictEqual(classifyToolRisk('fill_form_fields'), TOOL_RISK.REVERSIBLE_MUTATION);
assert.strictEqual(classifyToolRisk('click'), TOOL_RISK.EXTERNAL_SIDE_EFFECT);
assert.strictEqual(classifyToolRisk('run_js'), TOOL_RISK.HIGH_IMPACT);
assert.strictEqual(
  classifyToolCallRisk('type', { submit: true }),
  TOOL_RISK.EXTERNAL_SIDE_EFFECT
);
assert.strictEqual(
  classifyToolCallRisk('type', { submit: false }),
  TOOL_RISK.REVERSIBLE_MUTATION
);
assert.strictEqual(classifyToolRisk('does-not-exist'), TOOL_RISK.UNKNOWN);

assert.strictEqual(requiresExplicitApproval(TOOL_RISK.READ_ONLY), false);
assert.strictEqual(requiresExplicitApproval(TOOL_RISK.REVERSIBLE_MUTATION), false);
assert.strictEqual(requiresExplicitApproval(TOOL_RISK.HIGH_IMPACT), true);
assert.strictEqual(requiresExplicitApproval(TOOL_RISK.UNKNOWN), true);

assert.deepStrictEqual(buildToolPolicy('run_js'), {
  name: 'run_js',
  risk: TOOL_RISK.HIGH_IMPACT,
  requiresExplicitApproval: true
});

console.log('tool-policy.test.js passed');
