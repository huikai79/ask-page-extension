'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');

assert.ok(
  source.includes("decision: requestedMode === 'enforce' ? 'block' : 'allow'"),
  'enforce mode must fail closed when governance module is unavailable'
);

assert.ok(
  source.includes("Tool audit callback failed"),
  'audit callback failures should be isolated from execution'
);

assert.ok(
  source.includes("approval = 'error'"),
  'approval callback failures should be represented explicitly'
);

assert.ok(
  source.includes("批准流程失敗，因此未執行"),
  'approval callback failures must block execution'
);

console.log('governance-runtime-guard.test.js passed');


assert.ok(
  source.includes("functionDeclarations: getToolDefinitionsForRequest({"),
  'Gemini page tools must use risk-annotated definitions'
);
