---
name: fusion-review
description: Lightweight code review with compressed comments. Activate after completing a task in QUALITY mode, or when user asks for review.
---

# Fusion Code Review

Activate when: task complete in QUALITY mode, user says "review", "check my code", before merging.

## Review Checklist

Run through these 5 checks. One line per issue found.

### 1. Spec Compliance
Does the code match the design/plan? Any missing features?

### 2. Correctness
- Null/undefined guards on all external inputs?
- Error states handled (not just happy path)?
- Edge cases (empty arrays, zero values, max lengths)?

### 3. Test Quality
- Test covers the bug fix / feature?
- Test would catch a regression?
- No testing implementation details (test behavior, not internals)?

### 4. Code Quality
- DRY violations (same logic in 3+ places)?
- YAGNI violations (built for future that isn't here)?
- Naming: does the name tell you what it does?

### 5. Security (if applicable)
- SQL injection? (should be parameterized)
- XSS? (should be escaped)
- Secrets in code? (should be env vars)

## Output Format (Caveman Review Comments)
```
L42: 🔴 spec: /api/users GET missing pagination param
L87: 🟡 edge: `items.length === 0` returns undefined instead of []
L123: 🟢 tip: extract `validateEmail` to shared util (used 3x)
```

## Severity
- 🔴: must fix before merge (bug, missing feature, security)
- 🟡: should fix (edge case, perf concern)
- 🟢: nice to have (naming, DRY, style)

## Rules
- Max 5 comments per review. Focus on what matters.
- If no issues: "LGTM ✓"
- Never block on style preferences. Only block on bugs/spec gaps.
