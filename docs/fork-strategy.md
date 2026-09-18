# Fork Strategy

This repository currently follows `doggy8088/ask-page-extension`. Keep upstream tracking as the default unless this fork adopts a clear, testable product direction.

## Candidate local direction: governed browser agent

If this fork intentionally diverges, prioritize safe execution boundaries before adding more providers or tools.

### Proposed tool-risk classes

- **Read-only** — inspect DOM, metadata, selection, or page state.
- **Reversible mutation** — fill/edit local page state where a clear undo path exists.
- **External side effect** — submit, send, publish, or otherwise affect an external system.
- **Irreversible/high-impact** — destructive, financial, account, permission, or difficult-to-recover actions.

### Common execution pipeline

```text
request
  -> validate
  -> classify risk
  -> check permission / confirmation
  -> execute
  -> verify observed outcome
  -> record result
```

Tool implementations should not each reinvent permission, cancellation, error normalization, and logging behavior.

### State model

Prefer explicit states for long-running agent work:

```text
idle
-> preparing
-> requesting
-> streaming
-> tool_requested
-> tool_running
-> verifying
-> completed

terminal/alternate:
cancelled
failed
```

### Browser lifecycle tests worth adding

If a local variant is created, cover:

- service worker termination/restart;
- page navigation during a tool call;
- tab closure;
- revoked permissions;
- cancelled streaming/fetch;
- content-script reconnect;
- storage migration;
- failed or partially completed mutating tools.

## Upstream guardrail

Before every local feature:

1. verify it is not already solved upstream;
2. state why the local variant needs it;
3. add a test or acceptance criterion;
4. record the delta in a local changelog/fork-delta document.

If the fork does not adopt a distinct maintained direction, syncing upstream is preferable to accumulating incidental changes.
