'use strict';

const GOVERNANCE_MODE = Object.freeze({
  OBSERVE: 'observe',
  ENFORCE: 'enforce'
});

const EXECUTION_DECISION = Object.freeze({
  ALLOW: 'allow',
  REQUIRE_APPROVAL: 'require-approval',
  BLOCK: 'block'
});

function normalizeGovernanceMode(mode) {
  return mode === GOVERNANCE_MODE.ENFORCE
    ? GOVERNANCE_MODE.ENFORCE
    : GOVERNANCE_MODE.OBSERVE;
}

function planToolExecution(policy, options = {}) {
  const mode = normalizeGovernanceMode(options.mode);
  const requiresApproval = policy?.requiresExplicitApproval === true;

  if (!policy) {
    return {
      mode,
      decision: mode === GOVERNANCE_MODE.ENFORCE
        ? EXECUTION_DECISION.BLOCK
        : EXECUTION_DECISION.ALLOW,
      requiresApproval: mode === GOVERNANCE_MODE.ENFORCE,
      reason: 'missing-policy'
    };
  }

  if (!requiresApproval) {
    return {
      mode,
      decision: EXECUTION_DECISION.ALLOW,
      requiresApproval: false,
      reason: 'policy-allows'
    };
  }

  if (mode === GOVERNANCE_MODE.OBSERVE) {
    return {
      mode,
      decision: EXECUTION_DECISION.ALLOW,
      requiresApproval: true,
      reason: 'observe-only'
    };
  }

  return {
    mode,
    decision: EXECUTION_DECISION.REQUIRE_APPROVAL,
    requiresApproval: true,
    reason: 'explicit-approval-required'
  };
}

function buildToolAuditRecord({
  id = '',
  name = '',
  policy = null,
  plan = null,
  approval = 'not-requested',
  outcome = 'unknown',
  success = null,
  durationMs = null,
  error = null
} = {}) {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    toolCallId: id,
    toolName: name,
    risk: policy?.risk || 'unknown',
    governanceMode: plan?.mode || GOVERNANCE_MODE.OBSERVE,
    decision: plan?.decision || EXECUTION_DECISION.ALLOW,
    approval,
    outcome,
    success,
    durationMs,
    error: error ? String(error).slice(0, 500) : null
  };
}

function shouldBlockWithoutApproval(plan) {
  return (
    plan?.mode === GOVERNANCE_MODE.ENFORCE &&
    plan?.decision === EXECUTION_DECISION.REQUIRE_APPROVAL
  );
}

const AskPageToolGovernance = Object.freeze({
  GOVERNANCE_MODE,
  EXECUTION_DECISION,
  normalizeGovernanceMode,
  planToolExecution,
  buildToolAuditRecord,
  shouldBlockWithoutApproval
});

if (typeof globalThis !== 'undefined') {
  globalThis.AskPageToolGovernance = AskPageToolGovernance;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AskPageToolGovernance;
}
