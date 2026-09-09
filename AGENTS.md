# Agent workflow

Use roles for project-context and code work. Simple explanations and read-only answers that need no project
context can remain in the parent thread.

## Configured roles

Codex also exposes built-in roles. The repository-defined custom role set is exactly:

- `planner` (`.codex/agents/planner.toml`)
- `code_explorer` (`.codex/agents/code-explorer.toml`)
- `implementer` (`.codex/agents/implementer.toml`)
- `reviewer` (`.codex/agents/reviewer.toml`)
- `pusher` (`.codex/agents/pusher.toml`)

Custom-agent files provide role metadata and instructions, while config provides session-level settings and thread
limits. Lifecycle, dependency, DAG, review-loop, and push-gate rules remain manual parent-thread orchestration
conventions documented here, not declarative configuration features. Do not claim that the native configuration runs
an automatic DAG or lifecycle.

`max_concurrent_threads_per_session = 5` is the native ceiling for open subagent threads in this workflow. Completed
threads continue counting until explicitly closed. The workflow itself permits at most four concurrent Implementer
workers; the fifth slot is reserved for the retained Reviewer during a fix/re-review batch. Close Planner after
capturing its handoff, then close Explorer. Close every completed Implementer before starting another worker batch;
retain the same Reviewer for incremental re-review only while the top-level task is unchanged. When the top-level
objective changes, stop and close the old subagents, then spawn fresh roles with `task_name` values derived from the
new objective; `followup_task` cannot rename a thread, so never reuse stale names from the prior task. After the final
Reviewer `PASS`, close all remaining subagents before spawning Pusher.

The parent-thread handoff is authoritative. The ignored `/.codex-task-context.md` file is only a fallback snapshot
when a handoff cannot be passed directly; use `.codex/task-context.template.md` to create that snapshot. Do not use
the fallback to replace an available parent-thread handoff.

## Required workflow

For project-context or code work, run the roles in this order:

1. `planner` researches the project at the appropriate high level, identifies existing behavior and reusable
   patterns, and gives targeted questions and files to `code_explorer`. It is read-only and does not implement.
2. `code_explorer` starts only after the Planner handoff is available. It performs narrow evidence gathering across
   relevant routes, UI, data, API, and state precedents, then identifies exact files and integration points. It does
   not repeat broad research.
3. The parent performs plan validation after both handoffs. This is intentionally not a seventh role: the supported
   role set has no separate validator. Reconcile the original task, Planner intent, and Explorer evidence; reject
   unsupported assumptions; then write a FINAL IMPLEMENTATION CONTRACT before any implementation begins.
4. The parent acts as the Implementation Orchestrator. Classify the task as simple, moderate, or complex and spawn
   one to four instances of the reusable `implementer` role only when the contract proves genuinely independent
   workstreams. Assign each instance a unique workstream ID, exclusive file/symbol ownership, dependencies, input and
   output contracts, required existing patterns, and validation. Use one worker when work is coupled or ownership is
   unclear.
5. Wait for every active implementation worker. Do not start Reviewer while any worker is incomplete. Collect all
   worker handoffs, inspect the combined diff, reconcile dependencies and conflicts, and run the required
   cross-workstream checks. Record `INTEGRATION CHECK: PASS` only after all workers completed, ownership is respected,
   intended files are the only changed files, contracts are compatible, and validation passes.
6. `reviewer` runs only after the integration check and reviews the complete combined implementation as one change.
   It is the single read-only quality gate, reports evidence-backed findings by severity, and ends with the exact
   verdict `PASS` or `FIX REQUIRED`.
7. If the verdict is `FIX REQUIRED`, the parent classifies confirmed CRITICAL, HIGH, and MEDIUM findings by affected
   workstream. Spawn one to four new instances of the reusable `implementer` role only for independent fixes, with the
   same ownership and stop rules. Wait for every active fix worker, run the integration check again, and reuse the same
   Reviewer thread for incremental re-review of the complete combined patch. Multiple workers in one fix batch count
   as one re-review round. Allow at most two incremental re-review rounds; after the second unresolved `FIX REQUIRED`,
   stop automatic dispatch and report the blocker for parent/user direction.
8. After the final Reviewer `PASS`, the parent creates a CONSOLIDATED FINAL CHANGE SUMMARY from the actual final diff,
   all worker/fix handoffs, review findings, fixes, and validation. It must describe only completed work.
   After that summary is complete, the parent's final/default response must end with the standalone line exactly
   `nak commit dan push?`. Do not emit this prompt on `FIX REQUIRED` or before the final `PASS`. Only a clear
   affirmative reply to that exact prompt authorizes spawning Pusher; a no, ambiguous, unrelated, or absent reply does
   not spawn Pusher, and the parent handles or continues the current request.
9. `pusher` is permitted only after a final Reviewer `PASS`, a completed consolidated summary, and an explicit user
   request to push, ship, or publish. Without all three conditions it must refuse and make no Git write.

Every role returns a concise structured handoff containing its status, evidence, decisions, relevant files, and next
action. Pass each handoff through the parent thread, avoid duplicate broad research, preserve unrelated user work,
and do not commit or push during planning, exploration, implementation, or review.

## Plan validation and implementation contract

The parent must produce and validate a FINAL IMPLEMENTATION CONTRACT after Explorer and before spawning any
Implementer. The contract is the authoritative bridge between investigation and implementation and must contain:

- exact goal, current behavior, target behavior, and explicit regression boundaries;
- confirmed systems and patterns to reuse;
- exact files/symbols to modify, files to add only when necessary, and files that must not change;
- one to four workstreams, each with objective, exclusive ownership, dependencies, blockers, input contract, output
  contract, parallel peers, and validation;
- shared-file policy, integration order, edge cases, backwards compatibility, and success criteria;
- the commands/checks required for the integration check and final validation.

The parent must not dispatch a worker when the contract has unresolved evidence gaps, contradictory ownership, or a
dependency that makes the proposed parallelism unsafe. Reclassify the work as sequential or investigate the missing
evidence first.

Safe parallelism requires disjoint file and symbol write sets, no shared config/schema/migration/generated-output/
lockfile/fixture changes, no dependency on another worker's new API or state transition, and independently testable
boundaries. Tests must not mutate shared workspace state. A shared file has one owner; otherwise work is serialized or
reduced to one worker. A worker that discovers overlap, a missing dependency, or a contract contradiction must stop
and return `BLOCKED` rather than edit outside its assignment.

## Integration check

The parent performs an integration check after every implementation or fix batch and before Reviewer startup or
re-review. It must verify all active workers completed successfully, no worker is blocked, no ownership conflict or
unintended file exists, workstream output contracts connect, shared types/interfaces remain compatible, dependencies
are present, and relevant type/build/test checks pass. The Reviewer receives the complete combined change only after
the parent records `INTEGRATION CHECK: PASS`; this marker is a prerequisite, not a substitute for review.

## Review and shipping rules

The Reviewer freezes its target at the start from the user-named scope, current-task implementation, current diff,
or a reliable branch comparison, in that order. It begins with changed files, symbols, and relevant tests, expanding
only to directly related callers, callees, contracts, state transitions, persistence, schemas, and API boundaries
needed to prove a defect. Findings must show:

`trigger/state -> reachable execution path -> violated contract or invariant -> observable result`

The main thread independently classifies findings as `CONFIRMED`, `REJECTED`, or `UNCERTAIN`; only confirmed
CRITICAL, HIGH, or MEDIUM correctness/security defects normally require another implementation pass. Do not spend
review cycles on style preferences or unreachable theoretical risks.

The Pusher must receive the parent CONSOLIDATED FINAL CHANGE SUMMARY and independently inspect Git status, scope,
branch/remotes, validation, actual final diff, and possible secrets before any authorized write. It must not inspect
or use recent, past, or repository commit conventions when composing the commit. It must derive an appropriate commit
subject/title from the actual authorized final change and checked final diff, not historical style, an earlier plan, or
a worker summary. Whenever creating a commit, it must include a non-empty body accurately describing applicable
completed fixes, improvements, additions, and other relevant changes; include only applicable categories and never
fabricate claims. The parent summary is context, not proof. It must not alter feature logic or stage unrelated work.
It may perform only the explicitly authorized shipping actions after the final Reviewer `PASS`.

Manual parent orchestration is the only workflow contract. No automatic DAG, dependency, review-loop, or
reviewer/pusher gate is configured or implied by `.codex/config.toml`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
