# Fusion Optimizer — CLAUDE.md

Universal coding agent plugin. Works with Claude Code, Codex, Cursor, Gemini, Windsurf, Cline, Copilot, and any AGENTS.md tool.

## What It Does

Fusion Optimizer auto-detects task complexity and selects optimal quality/cost balance:
- **ZEN**: Simple tasks → caveman-ultra output, no methodology → 65% token savings
- **BALANCED**: Features → caveman-lite + TDD → 40% savings + tested code
- **QUALITY**: Architecture → lite output + full methodology → 25% savings + better design

## How to Use

1. Install: `node scripts/install.js` (auto-detects all agents)
2. Start coding — Fusion auto-selects mode
3. Force mode: `@zen`, `@quality`, or `@balanced` in any message
4. Check stats: `/fusion-stats`
5. Compress memory: `/compress`

## Architecture

```
fusion-optimizer/
├── .claude-plugin/plugin.json          # Claude Code manifest
├── .codex-plugin/plugin.json           # Codex manifest  
├── .cursor-plugin/plugin.json          # Cursor manifest
├── gemini-extension.json               # Gemini CLI extension
├── AGENTS.md                           # Universal cross-tool entry
├── CLAUDE.md                           # This file (Claude Code think-in-code)
├── GEMINI.md                           # Gemini context file
├── skills/                             # 8 skills (all cross-tool compatible)
│   ├── fusion-core/SKILL.md            # Mode arbitration + anti-loafing
│   ├── fusion-brainstorming/SKILL.md   # Lightweight design refinement
│   ├── fusion-tdd/SKILL.md             # RED-GREEN-REFACTOR (caveman output)
│   ├── fusion-debugging/SKILL.md       # 4-phase root cause process
│   ├── fusion-review/SKILL.md          # Compressed 5-check review
│   ├── fusion-memory/SKILL.md          # Cross-session persistence
│   ├── fusion-compress/SKILL.md        # /compress — permanent memory compression
│   └── fusion-stats/SKILL.md           # Session cost reports
├── hooks/                              # Claude Code hooks
│   ├── sessionstart.js                 # Init mode + inject fusion-core
│   ├── pretooluse.js                   # Smart tool routing (9 patterns)
│   ├── userpromptsubmit.js             # Per-turn mode re-evaluation
│   └── precompact.js                   # Session continuity snapshot
├── commands/                           # 6 slash commands
├── src/                                # Core libraries
│   ├── arbitrator.js                   # Mode selection engine
│   ├── compressor.js                   # Output compression rules
│   ├── router.js                       # Tool routing rules
│   ├── stats.js                        # Token/cost estimation
│   └── memory.js                       # Persistent memory manager
└── scripts/install.js                  # Universal one-command installer
```

## Mode Selection Rules

| Prompt pattern | Mode | Why |
|---------------|------|-----|
| fix typo, rename, delete, find, show, explain, search, format | ZEN | Single action, no methodology |
| add feature, implement, refactor, update, build | BALANCED | Code change → TDD |
| design, architecture, migrate, new project, system | QUALITY | Complex → full methodology |

Auto-escalation: 3+ consecutive failures → QUALITY
Budget protection: >80% token budget → force ZEN
Explicit override: @zen, @quality, @balanced

## Maintainer Notes

- Skills are original content — adapted from Superpowers and Caveman patterns
- Hooks are pure Node.js — zero external dependencies
- All plugin state in `.fusion/` directory (gitignorable)
- Cross-agent via multiple manifest files + universal AGENTS.md
- `/compress` rewrites memory files to caveman-speak (~46% smaller)
