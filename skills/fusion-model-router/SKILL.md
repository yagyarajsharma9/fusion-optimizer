---
name: fusion-model-router
description: Auto model routing — dispatches tasks to the cheapest sufficient model tier. ZEN→Haiku, BALANCED→Sonnet, QUALITY→Opus. Activates on every prompt.
mode: always
---

# Fusion Model Router — Auto Model Selection

## Core Rule

**Never pay Opus rates for Haiku work.** Every task auto-dispatches to the cheapest model that can succeed. Even on complex projects — simple tasks use cheap models. Auto-selection happens per prompt, not per project.

## How Auto-Switching Works (Even on Complex Projects)

```
Project: "Enterprise Microservice Migration" (COMPLEX project, QUALITY mode)
    │
    ├── User: "rename UserService to AccountService"
    │   → Per-prompt detection: TRIVIAL
    │   → Mode switches to ZEN (temporarily)
    │   → Dispatched to fusion-zen-agent (Haiku) ← CHEAP!
    │   → 3 seconds, $0.001
    │
    ├── User: "add OAuth middleware to auth.ts"
    │   → Per-prompt detection: MODERATE
    │   → Mode switches to BALANCED
    │   → Dispatched to fusion-balanced-agent (Sonnet) ← MID!
    │   → 15 seconds, $0.02
    │
    └── User: "design the database sharding strategy"
        → Per-prompt detection: COMPLEX
        → Stays QUALITY, handled by main model (Opus) ← PREMIUM!
        → 45 seconds, $0.30
```

**Even on the most complex project, 60-70% of prompts still trigger cheap models.** The project difficulty doesn't matter — EVERY prompt is independently evaluated.

## Model Source

Models come from `.fusion/model-config.json` (created by `/fusion-setup`). The agent DISPATCH includes the model override from config:

```
ZEN → Task(subagent: "fusion-zen-agent", model: "${config.zen.model}", ...)
BALANCED → Task(subagent: "fusion-balanced-agent", model: "${config.balanced.model}", ...)
```

If config not found, use agent file defaults (Haiku/Sonnet/Opus).

## Dispatch Table

| Task Complexity | Mode | Agent to Use | Model | Cost vs Opus |
|----------------|------|-------------|-------|-------------|
| Trivial (fix typo, rename, find, format) | ZEN | `fusion-zen-agent` | Haiku | **~97% cheaper** |
| Moderate (add feature, refactor, fix bug) | BALANCED | `fusion-balanced-agent` | Sonnet | **~85% cheaper** |
| Complex (design, migrate, architecture) | QUALITY | Main model (self) | Opus | Baseline |

## When to Dispatch

### ALWAYS dispatch these to ZEN agent (Haiku):
- File searches (glob, grep, find)
- File reads for analysis (not editing)
- Rename variables, format code, fix typos
- Answer "what is X", "where is Y", "how does Z work"
- Run simple status commands (git status, npm ls, ls)

### ALWAYS dispatch these to BALANCED agent (Sonnet):
- Implement ONE feature from approved plan
- Refactor ONE file with tests
- Fix ONE medium bug (not subtle/architectural)
- Write tests for existing code
- Mechanical edits from complete spec

### Keep on main model (Opus):
- Design decisions, architecture planning
- Debugging subtle/performance issues
- Multi-file coordination
- Review agent outputs for quality
- Any task marked UNCERTAINTIES or ESCALATE

## Dispatch Protocol

1. Classify task into ZEN / BALANCED / QUALITY
2. For ZEN/BALANCED: dispatch subagent with `Task` tool, specifying agent name
3. Wait for result
4. If result is "FAILED" or "ESCALATE": handle on main model
5. If result is successful: accept and continue

## Parallel Dispatch

For independent tasks: dispatch ALL simultaneously.
```
Task 1: fusion-zen-agent (search for all .ts files)
Task 2: fusion-zen-agent (search for TODO comments)
Task 3: fusion-balanced-agent (refactor UserService.ts)
```
All 3 run in parallel. Cheaper + faster.

## Cost Tracking

After each subagent dispatch, note: `[AGENT: fusion-zen-agent | MODEL: haiku | SAVED: ~97% vs Opus]`

## Anti-Patterns (NEVER)
- Never read a file inline that an agent could read → dispatch search agent
- Never grep inline that an agent could grep → dispatch search agent
- Never implement on Opus what Sonnet can handle → dispatch balanced agent
- Never ask "should I delegate this?" → just delegate it
- Wait for agent result before responding → parallel dispatch when possible
