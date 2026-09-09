# Task Context (Fallback Only)

Use this ignored snapshot only when the parent-thread handoff cannot be passed directly. Keep it concise and do not
treat it as more authoritative than the parent thread.

## TASK

<!-- User request, scope, and constraints. -->

## PROJECT CONTEXT

<!-- Relevant project structure and existing behavior. -->

## PLANNER DECISION

<!-- Planner's scope, reuse decision, risks, and Explorer questions. -->

## SKILL / CAPABILITY RECOMMENDATION

<!-- Selected available skills/tools and fit, considered-but-rejected options and reasons, discovery results or
     unavailable-capability limits, and the downstream role/phase action. For named or clearly triggered skills,
     record that the downstream role must read the complete SKILL.md before acting. -->

## EXPLORATION FINDINGS

<!-- Verified evidence, contracts, edge cases, and integration points. -->

## RELEVANT FILES

<!-- Exact files, symbols, routes, tests, and schemas. -->

## EXISTING PATTERNS TO REUSE

<!-- Established conventions and precedents. -->

## IMPLEMENTATION CONTRACT

<!-- Parent-validated goal, current/target behavior, regression boundaries, exact files, workstreams, ownership,
     dependencies, shared-file policy, integration requirements, edge cases, and validation/success criteria. -->

## WORKSTREAM HANDOFFS

<!-- One concise completion or BLOCKED report per assigned Implementer/fix worker, including files, output contract,
     validation, and risks. -->

## INTEGRATION CHECK

<!-- Combined diff/file ownership/dependency checks and cross-workstream validation. Record PASS before Reviewer. -->

## IMPLEMENTATION SUMMARY

<!-- Changes made and files affected. -->

## VALIDATION RESULTS

<!-- Commands run, outcomes, and known limitations. -->

## REVIEW FINDINGS

<!-- Severity, evidence, classification, and Reviewer verdict. -->

## FINAL CHANGE SUMMARY

<!-- Actual final diff, files changed, implemented behavior, intentional behavior changes, review fixes, validation,
     and final impact. The Pusher consumes this only after the final Reviewer PASS. -->

## FINAL STATUS

<!-- PASS, FIX REQUIRED, or shipping status with next action. -->
