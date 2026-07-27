---
name: fusion-memory
description: Cross-session persistent memory. Saves key decisions and project context to .fusion/memory.md. Activate at session end, or when user says "remember this", "save context".
---

# Fusion Memory

Activate when: session ending, user says "remember", "save this for later", "don't forget", after major decision, after fixing a nasty bug.

## Memory Structure

Store in `.fusion/memory.md`:

```markdown
# Project Memory

## Architecture Decisions
- [date] Decision: what — Why: reason — Context: file/path

## Gotchas & Bugs
- [date] Bug: what — Fix: how — File: path

## Active Context
- Current branch: name
- Current feature: what we're building
- Blocked by: what's in the way (if any)
```

## Save Triggers
Auto-save after:
1. Architecture decision made (brainstorming)
2. Bug fixed with non-obvious root cause
3. Feature complete
4. Session ending (PreCompact hook)

## Load on SessionStart
On new session: read `.fusion/memory.md` and surface:
- Current branch and feature
- Recent decisions that affect current work
- Known gotchas in files being edited

## Memory Hygiene
- Keep file under 200 lines. Archive old entries to `.fusion/memory-archive.md`.
- Delete entries older than 30 days.
- One entry = one line. Compressed format.

## Output Format
```
SAVED: decision "use JWT over session auth" to .fusion/memory.md
LOADED: 3 decisions, 1 gotcha, branch: feat/auth
```
