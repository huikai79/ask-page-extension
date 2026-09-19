# Governed Tool Execution

AskPage V3 separates **tool capability**, **governance decision**, and **tool implementation**.

The goal is to prevent every tool from inventing its own approval/error/audit behavior inside `content.js`.

## Execution pipeline

```text
tool request
  -> policy classification
  -> governance preflight
  -> optional approval
  -> existing tool implementation
  -> outcome
  -> audit record
```

The existing tool implementations remain behind `executeToolCallUngoverned`. The public execution path is the governance wrapper `executeToolCall`.

## Policy layer

`lib/tool-policy.js` answers:

- what risk class the tool/call belongs to;
- whether that risk normally requires explicit approval.

Risk classes currently include:

- `read-only`
- `reversible-mutation`
- `external-side-effect`
- `high-impact`
- `unknown`

Risk can depend on arguments. For example, text input with `submit: true` is more consequential than text input without submission.

## Governance layer

`lib/tool-governance.js` answers what to do with the policy result.

### Observe mode

Observe is the default compatibility mode.

A risky call is:

- classified;
- surfaced to the model/runtime;
- eligible for audit;

but is not blocked solely because an approval UI has not yet been wired.

This preserves existing AskPage behavior while the governance architecture is introduced.

### Enforce mode

Enforce mode is fail-closed.

When policy requires approval:

1. the execution wrapper calls `toolContext.requestToolApproval`;
2. missing approval handler blocks execution;
3. denial blocks execution;
4. only explicit approval continues into the existing tool implementation.

A missing policy also blocks in enforce mode.

## Approval contract

The approval callback receives:

```text
id
name
args
policy
plan
```

It returns either:

- `true`; or
- an object containing `approved: true`

to approve.

Anything else is treated as denial.

V3 intentionally does not prescribe the final UI. A future UI can present preview/explanation/target details and resume the tool loop through the same callback contract.

## Audit contract

`toolContext.onToolAudit` may receive a normalized record containing:

- tool call ID/name;
- risk class;
- governance mode and decision;
- approval state;
- outcome;
- success;
- duration;
- bounded error text.

This is operational metadata, not hidden model chain-of-thought.

## Current boundary

V3 provides the execution architecture and enforcement hook. **The existing UI still runs in observe mode unless a caller explicitly supplies enforce mode plus an approval handler.**

Therefore this version should not be described as “all high-impact actions require interactive confirmation” yet.

That product behavior becomes true only after the UI/agent loop wires the approval callback and tests continuation/cancellation behavior.

## Regression requirements

A future tool execution change should preserve:

1. policy classification before execution;
2. fail-closed behavior for enforce mode when approval is unavailable;
3. no execution after denial;
4. existing tool behavior in observe mode;
5. an audit hook after executed or blocked calls;
6. cancellation semantics in the underlying tool implementation.
