'use strict';

const assert = require('assert');
const {
  createElement,
  createDocument,
  createGovernedContentScriptSandbox
} = require('./helpers/mock-dom');

const body = createElement('body');
const documentRef = createDocument(body, 'Governed execution integration');

let executions = 0;
const { executeToolCall, isAskTaskCancellationError } =
  createGovernedContentScriptSandbox(
    documentRef,
    '{ executeToolCall, isAskTaskCancellationError }',
    {
      async sendMessage(message) {
        if (message?.action === 'execute-main-world-javascript') {
          executions += 1;
          return {
            success: true,
            result: {
              success: true,
              message: 'executed',
              data: { value: 1 },
              warnings: [],
              matchedTargets: []
            }
          };
        }
        return { success: true };
      }
    }
  );

async function run() {
  const audits = [];

  const denied = await executeToolCall(
    { id: 'deny', name: 'run_js', args: { code: 'return 1;' } },
    {
      governanceMode: 'enforce',
      requestToolApproval: async () => ({ approved: false }),
      validateToolPrecondition: async () => ({ valid: true }),
      onToolAudit: (record) => audits.push(record)
    }
  );
  assert.strictEqual(denied.result.success, false);
  assert.match(denied.result.message, /未獲批准/);
  assert.strictEqual(executions, 0);

  const staleTarget = await executeToolCall(
    { id: 'stale', name: 'run_js', args: { code: 'return 2;' } },
    {
      governanceMode: 'enforce',
      requestToolApproval: async () => ({ approved: true }),
      validateToolPrecondition: async () => ({ valid: false }),
      onToolAudit: (record) => audits.push(record)
    }
  );
  assert.strictEqual(staleTarget.result.success, false);
  assert.match(staleTarget.result.message, /precondition/);
  assert.strictEqual(executions, 0);

  const approvalFailure = await executeToolCall(
    { id: 'approval-error', name: 'run_js', args: { code: 'return 3;' } },
    {
      governanceMode: 'enforce',
      requestToolApproval: async () => {
        throw new Error('approval unavailable');
      },
      validateToolPrecondition: async () => ({ valid: true }),
      onToolAudit: (record) => audits.push(record)
    }
  );
  assert.strictEqual(approvalFailure.result.success, false);
  assert.match(approvalFailure.result.message, /批准流程失敗/);
  assert.strictEqual(executions, 0);

  const executed = await executeToolCall(
    { id: 'execute', name: 'run_js', args: { code: 'return 4;' } },
    {
      governanceMode: 'enforce',
      requestToolApproval: async ({ args }) => {
        assert.strictEqual(Object.isFrozen(args), true);
        return { approved: true };
      },
      validateToolPrecondition: async ({ args }) => {
        assert.strictEqual(args.code, 'return 4;');
        return { valid: true };
      },
      onToolAudit: async (record) => {
        audits.push(record);
        throw new Error('audit sink unavailable');
      }
    }
  );
  assert.strictEqual(executed.result.success, true);
  assert.strictEqual(executions, 1);

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    executeToolCall(
      { id: 'cancel', name: 'run_js', args: { code: 'return 5;' } },
      {
        governanceMode: 'enforce',
        signal: controller.signal,
        requestToolApproval: async () => ({ approved: true }),
        validateToolPrecondition: async () => ({ valid: true })
      }
    ),
    (error) => isAskTaskCancellationError(error)
  );
  assert.strictEqual(executions, 1);

  assert.ok(
    audits.some((record) => record.toolCallId === 'deny' && record.outcome === 'blocked')
  );
  assert.ok(
    audits.some((record) => record.toolCallId === 'execute' && record.outcome === 'executed')
  );

  console.log('governed-execution.integration.test.js passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
