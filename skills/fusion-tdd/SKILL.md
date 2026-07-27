---
name: fusion-tdd
description: Test-driven development with caveman output. RED-GREEN-REFACTOR cycle enforced. Tests first, always. Activate for BALANCED and QUALITY modes when writing or modifying code.
---

# Fusion TDD

Activate when: writing new code, modifying logic, adding features. NOT for: config changes, typos, comments, formatting.

## The Cycle (Non-Negotiable)

### RED: Write failing test
- Write the test that proves the feature works
- Run it: `npm test -- -t "test name"`
- Confirm it FAILS for the right reason
- Output: "RED: test_name fails — expected X, got Y ✓"

### GREEN: Minimal code
- Write ONLY enough code to make the test pass
- No refactoring, no abstraction, no "future-proofing"
- Run test: confirm it PASSES
- Output: "GREEN: test_name passes ✓"

### REFACTOR: Clean up
- Extract duplicates, improve names, remove dead code
- Tests must stay GREEN during refactor
- Output: "REFACTOR: extracted X, renamed Y ✓"

### Commit
- `git add -A && git commit -m "test: feature_name"`
- Output: "COMMIT: abc1234 test: feature_name ✓"

## Rules
- NEVER write code before the test. Delete code written before tests.
- Test ONE thing per test case.
- Keep tests minimal. 5-15 lines.
- If feature doesn't need a test (pure config, CSS), skip TDD but say so.

## Output Format (Caveman TDD)
```
RED: test_auth_token_expiry — expected 401, got 200 ✓
GREEN: test_auth_token_expiry — passes ✓  
REFACTOR: extracted validateToken() ✓
COMMIT: abc1234 fix: auth token expiry check ✓
```

## When Tests Fail Unexpectedly
- Don't "try something else". Debug systematically.
- Activate fusion-debugging skill if stuck.
