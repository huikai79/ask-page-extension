'use strict';

const TOOL_RISK = Object.freeze({
  READ_ONLY: 'read-only',
  REVERSIBLE_MUTATION: 'reversible-mutation',
  EXTERNAL_SIDE_EFFECT: 'external-side-effect',
  HIGH_IMPACT: 'high-impact',
  UNKNOWN: 'unknown'
});

const TOOL_RISK_MAP = Object.freeze({
  web_search: TOOL_RISK.READ_ONLY,
  get_page_metadata: TOOL_RISK.READ_ONLY,
  inspect_selection: TOOL_RISK.READ_ONLY,
  inspect_form_fields: TOOL_RISK.READ_ONLY,
  read_page: TOOL_RISK.READ_ONLY,
  find: TOOL_RISK.READ_ONLY,
  get_page_text: TOOL_RISK.READ_ONLY,
  click: TOOL_RISK.EXTERNAL_SIDE_EFFECT,
  type: TOOL_RISK.REVERSIBLE_MUTATION,
  select_option: TOOL_RISK.REVERSIBLE_MUTATION,
  fill_form_fields: TOOL_RISK.REVERSIBLE_MUTATION,
  run_js: TOOL_RISK.HIGH_IMPACT
});

function classifyToolRisk(name) {
  return TOOL_RISK_MAP[name] || TOOL_RISK.UNKNOWN;
}

function classifyToolCallRisk(name, args = {}) {
  const baseRisk = classifyToolRisk(name);
  if (name === 'type' && args && args.submit === true) {
    return TOOL_RISK.EXTERNAL_SIDE_EFFECT;
  }
  return baseRisk;
}

function requiresExplicitApproval(risk) {
  return (
    risk === TOOL_RISK.EXTERNAL_SIDE_EFFECT ||
    risk === TOOL_RISK.HIGH_IMPACT ||
    risk === TOOL_RISK.UNKNOWN
  );
}

function buildToolPolicy(name, args = {}) {
  const risk = classifyToolCallRisk(name, args);
  return {
    name,
    risk,
    requiresExplicitApproval: requiresExplicitApproval(risk)
  };
}

const AskPageToolPolicy = Object.freeze({
  TOOL_RISK,
  TOOL_RISK_MAP,
  classifyToolRisk,
  classifyToolCallRisk,
  requiresExplicitApproval,
  buildToolPolicy
});

if (typeof globalThis !== 'undefined') {
  globalThis.AskPageToolPolicy = AskPageToolPolicy;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AskPageToolPolicy;
}
