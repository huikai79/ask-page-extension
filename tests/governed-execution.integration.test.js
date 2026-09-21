'use strict';

const assert = require('assert');
const { buildToolPolicy } = require('../lib/tool-policy');
const {
  executeGovernedToolCall
} = require('../lib/tool-governance');

function blockedResult({
  id,
  name,
  policy,
  plan,
  approval,
  precondition,
  error
}) {
  return {
    id,
    name,
    result: {
      success: false,
      data: {
        governance: {
          risk: policy?.risk || 'unknown',
          mode: plan?.mode || 'observe',
          decision: plan?.decision || 'block',
          approval,
          precondition,
          error
        }
      }
    }
  };
}

async function run() {
  let executions = 0;
  const audits = [];
  const execute = async (toolCall) => {
    executions += 1;
    return {
      id: toolCall.id,
      name: toolCall.name,
      result: {
        success: true,
        data: {
          code: toolCall.args.code
        }
      }
    };
  };

  const denied = await executeGovernedToolCall({
    toolCall: { id: 'deny', name: 'run_js', args: { code: 'return 1;' } },
    mode: 'enforce',
    buildPolicy: buildToolPolicy,
    requestApproval: async () => ({ approved: false }),
    validatePrecondition: async () => ({ valid: true }),
    execute,
    onAudit: (record) => audits.push(record),
    createBlockedResult: blockedResult
  });
  assert.strictEqual(denied.result.success, false);
  assert.strictEqual(denied.result.data.governance.approval, 'denied');
  assert.strictEqual(executions, 0);

  const staleTarget = await executeGovernedToolCall({
    toolCall: { id: 'stale', name: 'run_js', args: { code: 'return 2;' } },
    mode: 'enforce',
    buildPolicy: buildToolPolicy,
    requestApproval: async () => ({ approved: true }),
    validatePrecondition: async () => ({ valid: false }),
    execute,
    onAudit: (record) => audits.push(record),
    createBlockedResult: blockedResult
  });
  assert.strictEqual(staleTarget.result.success, false);
  assert.strictEqual(staleTarget.result.data.governance.precondition, 'rejected');
  assert.strictEqual(executions, 0);

  const approvalFailure = await executeGovernedToolCall({
    toolCall: { id: 'approval-error', name: 'run_js', args: { code: 'return 3;' } },
    mode: 'enforce',
    buildPolicy: buildToolPolicy,
    requestApproval: async () => {
      throw new Error('approval unavailable');
    },
    validatePrecondition: async () => ({ valid: true }),
    execute,
    onAudit: (record) => audits.push(record),
    createBlockedResult: blockedResult
  });
  assert.strictEqual(approvalFailure.result.success, false);
  assert.strictEqual(approvalFailure.result.data.governance.approval, 'error');
  assert.strictEqual(executions, 0);

  const original = { code: 'return 4;', nested: { value: 1 } };
  const executed = await executeGovernedToolCall({
    toolCall: { id: 'execute', name: 'run_js', args: original },
    mode: 'enforce',
    buildPolicy: buildToolPolicy,
    requestApproval: async ({ args }) => {
      assert.strictEqual(Object.isFrozen(args), true);
      assert.strictEqual(Object.isFrozen(args.nested), true);
      original.code = 'mutated after approval';
      original.nested.value = 99;
      return { approved: true };
    },
    validatePrecondition: async ({ args }) => {
      assert.strictEqual(args.code, 'return 4;');
      assert.strictEqual(args.nested.value, 1);
      return { valid: true };
    },
    execute,
    onAudit: async (record) => {
      audits.push(record);
      throw new Error('audit sink unavailable');
    },
    createBlockedResult: blockedResult
  });
  assert.strictEqual(executed.result.success, true);
  assert.strictEqual(executed.result.data.code, 'return 4;');
  assert.strictEqual(executions, 1);

  const cancellationError = Object.assign(new Error('cancelled'), {
    name: 'AbortError'
  });
  await assert.rejects(
    executeGovernedToolCall({
      toolCall: { id: 'cancel', name: 'run_js', args: { code: 'return 5;' } },
      mode: 'enforce',
      buildPolicy: buildToolPolicy,
      requestApproval: async () => {
        throw cancellationError;
      },
      validatePrecondition: async () => ({ valid: true }),
      execute,
      createBlockedResult: blockedResult,
      isCancellationError: (error) => error?.name === 'AbortError'
    }),
    (error) => error === cancellationError
  );
  assert.strictEqual(executions, 1);

  const observed = await executeGovernedToolCall({
    toolCall: { id: 'observe', name: 'run_js', args: { code: 'return 6;' } },
    mode: 'observe',
    buildPolicy: buildToolPolicy,
    execute,
    onAudit: (record) => audits.push(record),
    createBlockedResult: blockedResult
  });
  assert.strictEqual(observed.result.success, true);
  assert.strictEqual(executions, 2);

  assert.ok(
    audits.some((record) => record.toolCallId === 'deny' && record.outcome === 'blocked')
  );
  assert.ok(
    audits.some((record) => record.toolCallId === 'execute' && record.outcome === 'executed')
  );
  assert.ok(
    audits.some((record) => record.toolCallId === 'observe' && record.outcome === 'executed')
  );

  console.log('governed-execution.integration.test.js passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
