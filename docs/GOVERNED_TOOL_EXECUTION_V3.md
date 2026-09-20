# Governed Tool Execution v3

AskPage separates **tool capability**, **risk policy**, and **execution governance**.

## Flow

```text
tool call
  -> risk classification
  -> governance preflight
  -> optional approval
  -> execution
  -> observed result
  -> audit record
```

## Modes

- `observe` is the compatibility default. Risk and approval requirements are computed and can be audited, but existing tool execution is not blocked.
- `enforce` requires an approval handler for policy-marked tools. Missing approval infrastructure fails closed.

The governance module does not decide UI. A future confirmation surface implements `requestToolApproval`; the execution layer consumes the result.

## Boundaries

Risk is classified by **capability**, not assumed intent. For example, a click may submit a form or trigger an external action.

Governance metadata is not proof that an action is safe. Post-execution verification remains necessary for mutating or external-side-effect tools.

Unknown tools require approval under the policy layer and are blocked in enforce mode when no policy/approval path is available.

## Audit contract

The runtime can emit structured records containing:

- tool call ID and name;
- risk class;
- governance mode and decision;
- approval outcome;
- execution outcome and success;
- duration;
- bounded error text.

Audit records are execution evidence, not authorization by themselves.
