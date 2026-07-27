---
name: fusion-debugging
description: Systematic debugging with context-mode integration. 4-phase root cause process. Activate for bug fixes in BALANCED and QUALITY modes.
---

# Fusion Debugging

Activate when: fixing bugs, investigating failures, "why is X broken", test failures.

## 4-Phase Process

### Phase 1: REPRODUCE
- Write minimal reproduction script or test
- Confirm: "Reproduced: [what happens]"
- If can't reproduce → ask for more context, don't guess

### Phase 2: ISOLATE
- Binary search through code: comment out half, check if bug persists
- Add strategic console.log/breakpoints
- Narrow to specific function/line
- Output: "Isolated: bug in X at line N — [root cause in 1 sentence]"

### Phase 3: FIX
- Write failing test (fusion-tdd)
- Apply minimal fix
- Verify test passes
- Output: "Fixed: [1-line fix description]"

### Phase 4: VERIFY
- Run full test suite
- Check for similar bugs in nearby code
- Output: "Verified: all tests pass, no similar issues"

## Context-Mode Integration
- Dump test output to sandbox, not context
- Search logs with context-mode search, don't cat
- Use `ctx_execute` for running debug commands

## Rules
- NEVER "try random fixes". Each change must have a hypothesis.
- If stuck after 2 attempts → escalate to QUALITY mode for methodology help.
- Delete debug prints after fixing. No leftover console.log.

## Output Format (Caveman Debugging)
```
REPRODUCED: GET /api/users returns 500 on empty DB
ISOLATED: UserService.getAll() — NPE when no rows returned. Line 42.
FIXED: added `if (!rows) return []` guard
VERIFIED: 23/23 tests pass, 0 similar NPEs found
```
