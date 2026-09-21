'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const contentSource = fs.readFileSync(
  path.join(__dirname, '..', 'content.js'),
  'utf8'
);
const governanceSource = fs.readFileSync(
  path.join(__dirname, '..', 'lib', 'tool-governance.js'),
  'utf8'
);

assert.ok(
  contentSource.includes("governance?.executeGovernedToolCall"),
  'content runtime must delegate governed execution to the shared orchestrator'
);

assert.ok(
  contentSource.includes("toolContext.governanceMode === 'enforce'"),
  'adapter must preserve fail-closed behavior when governance module is unavailable'
);

assert.ok(
  contentSource.includes("governance-module-unavailable"),
  'adapter must explain missing governance module'
);

assert.ok(
  contentSource.includes("functionDeclarations: getToolDefinitionsForRequest({"),
  'Gemini page tools must use risk-annotated definitions'
);

assert.ok(
  governanceSource.includes("snapshotToolArguments"),
  'orchestrator must snapshot approved arguments'
);

assert.ok(
  governanceSource.includes("validatePrecondition"),
  'orchestrator must support post-approval precondition validation'
);

assert.ok(
  governanceSource.includes("isCancellationError"),
  'orchestrator must preserve cancellation semantics'
);

assert.ok(
  governanceSource.includes("Async tool audit callback failed"),
  'async audit callback rejection must be isolated from execution'
);

assert.ok(
  governanceSource.includes("EXECUTION_DECISION.REQUIRE_APPROVAL"),
  'orchestrator must have an explicit approval-required decision'
);

console.log('governance-runtime-guard.test.js passed');
