# Fusion Optimizer — Smart Quality + Cost Balance for Claude Code

**Primary target: Claude Code. OpenCode, Cursor, Gemini, and other agents are optionally supported — contributions welcome!**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)

### 🎯 Built for Claude Code — Full 5/5 Features
### 🔌 Also works with: OpenCode · Codex · Cursor · Gemini CLI · Windsurf · Cline · Copilot

---

## ⚠️ Prerequisites — MUST Install Before Use

This plugin is **zero-dependency** — we don't ship packages. You must have these installed on your machine:

| Requirement | Version | Check | Install |
|------------|---------|-------|---------|
| **Node.js** | >= 18.x | `node --version` | [nodejs.org](https://nodejs.org) |
| **Claude Code** | Latest | `claude --version` | [claude.ai/install](https://claude.ai/install) |
| **Git** | Any | `git --version` | [git-scm.com](https://git-scm.com) |

```bash
# Verify everything is installed before proceeding:
node --version    # Must be v18.x or higher
claude --version  # Must show Claude Code
git --version     # Must be installed
```

> **Why no packages in this repo?** Professional plugins don't bundle `node_modules`. Our hooks use only Node.js built-ins (`fs`, `path`). No `npm install` needed. Zero dependencies. Standard practice — same as Caveman, Superpowers, and Claude Code's official plugins.

---

## The Global Problem

Every coding agent faces the same dilemma:

| Approach | Plugin | Token Impact | Quality |
|----------|--------|-------------|---------|
| Quality | Superpowers | +3-8k tokens/session | Best-in-class |
| Cost | Caveman | -65% output tokens | Neutral |
| Cost | Context-Mode | -98% context usage | Neutral |

**The conflict**: Quality plugins demand verbose explanations. Cost plugins demand terse output. They fight. Using them together makes the agent confused.

**The solution**: Don't pick sides. Auto-detect the task and use the right approach.

## How Fusion Optimizer Works

### The Pipeline — Every Request Gets Optimized

```
                          ┌─────────────────────────────────────────┐
                          │           YOUR WORKSPACE                │
                          │   (Claude Code + Fusion Optimizer)      │
                          └─────────────────────────────────────────┘
                                          │
                              ┌───────────┴───────────┐
                              │   User sends prompt    │
                              └───────────┬───────────┘
                                          │
                          ┌───────────────▼───────────────┐
                          │   STEP 1: MODE DETECTION      │
                          │   analyzes prompt complexity   │
                          │   ┌─────┐ ┌─────┐ ┌─────┐    │
                          │   │ ZEN │ │ BAL │ │QUAL │    │
                          │   └──┬──┘ └──┬──┘ └──┬──┘    │
                          └──────┼───────┼───────┼───────┘
                                 │       │       │
              ┌──────────────────┼───────┼───────┼──────────────────┐
              │                  │       │       │                  │
    ┌─────────▼─────────┐ ┌──────▼───────▼───────▼──────┐ ┌────────▼─────────┐
    │  "fix typo"       │ │  "add feature"              │ │  "design system"  │
    │  "find file"      │ │  "refactor code"            │ │  "new project"    │
    │  "what is X"      │ │  "fix bug"                  │ │  "migrate to Y"   │
    └─────────┬─────────┘ └──────────────┬──────────────┘ └────────┬─────────┘
              │                          │                          │
    ┌─────────▼─────────┐    ┌───────────▼───────────┐    ┌────────▼─────────┐
    │    ZEN MODE       │    │    BALANCED MODE      │    │   QUALITY MODE   │
    │  (cost-optimized) │    │      (default)        │    │  (full method)   │
    ├───────────────────┤    ├───────────────────────┤    ├──────────────────┤
    │ Output: fragments │    │ Output: short sent.   │    │ Output: lite     │
    │ Methods: none     │    │ Methods: TDD + debug  │    │ Methods: ALL     │
    │ Routing: active   │    │ Routing: large out    │    │ Routing: off     │
    │ Save: ~65% output │    │ Save: ~40% output     │    │ Save: ~25% out   │
    └─────────┬─────────┘    └───────────┬───────────┘    └────────┬─────────┘
              │                          │                          │
              └──────────────────────────┼──────────────────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │  STEP 2: TOOL ROUTING       │
                          │  (22 patterns, auto-apply)  │
                          │                             │
                          │  git log  → --oneline -n 30 │
                          │  npm test → | tail -30      │
                          │  pip inst → -q              │
                          │  curl     → WARN (fetch)    │
                          │  docker   → -q              │
                          │  ...17 more patterns        │
                          └──────────────┬──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │  STEP 3: OUTPUT COMPRESSION │
                          │  (3 compression levels)     │
                          │                             │
                          │  LITE: drop filler phrases  │
                          │  ULTRA: fragments, symbols  │
                          │  CODE: one-line review      │
                          └──────────────┬──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │  STEP 4: MEMORY PERSISTENCE │
                          │                             │
                          │  Save to .fusion/memory.md  │
                          │  Decisions, gotchas, fixes  │
                          │  Load on next session start │
                          └──────────────┬──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │      TOKEN SAVINGS          │
                          │  ┌─────────────────────┐    │
                          │  │ Input  saved: 30-60% │    │
                          │  │ Output saved: 25-65% │    │
                          │  │ Cost   saved: 15-55% │    │
                          │  └─────────────────────┘    │
                          └─────────────────────────────┘
```

### The Decision Tree — How Mode is Selected

```
                    ┌──────────────────────┐
                    │   USER PROMPT        │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Contains @zen /       │
                    │ @quality / @balanced? │
                    └──────┬──────┬────────┘
                           │YES   │NO
                    ┌──────▼─┐  ┌─▼─────────────────────────────┐
                    │ Force  │  │ Analyze prompt with 50+        │
                    │ mode   │  │ pattern detectors:             │
                    └────────┘  │                               │
                                │ Fix typo/rename/delete? → ZEN  │
                                │ Add/implement/refactor? → BAL  │
                                │ Design/migrate/system? → QUAL  │
                                │ 3+ failures in a row?  → QUAL  │
                                │ >80% token budget?     → ZEN   │
                                └──────────────┬────────────────┘
                                               │
                                ┌──────────────▼────────────────┐
                                │  [ZEN]  |  [BALANCED]  |  [QUALITY]
                                │ 65% out |  40% out     |  25% out
                                │ 60% ctx |  30% ctx     |  15% ctx
                                │ no meth |  TDD + debug |  full SDLC
                                └────────────────────────────────┘
```

### Workspace Effectiveness — Before vs After

```
 ┌─────────────────────────────────┐   ┌──────────────────────────────────┐
 │   WITHOUT FUSION OPTIMIZER      │   │    WITH FUSION OPTIMIZER          │
 ├─────────────────────────────────┤   ├──────────────────────────────────┤
 │                                 │   │                                  │
 │  User: "fix the bug in auth"    │   │  User: "@zen fix the bug in auth" │
 │                                 │   │  → Auto: ZEN mode (TRIVIAL task) │
 │  Agent: "Sure! Let me look      │   │  → Output: "Bug: null L42. Fix:  │
 │  at the codebase first. I       │   │    add guard. Verified."         │
 │  think the issue is probably    │   │  → Tools: git log auto-limited   │
 │  in the auth middleware. Let     │   │  → Context: no raw logs dumped   │
 │  me explain what I found..."    │   │  → Tokens: 250 → 85 (-66%)       │
 │  [300 tokens]                   │   │  → Time: 8s → 3s (-63%)         │
 │                                 │   │                                  │
 │  User: "add the login page"     │   │  User: "add the login page"      │
 │                                 │   │  → Auto: BALANCED (MODERATE)    │
 │  Agent: "I'll help you build    │   │  → Output: "[BALANCED] Created   │
 │  the login page. Let me first   │   │    Login.svelte. Tests: 3/3 pass │
 │  write the tests, then create   │   │    RED→GREEN→REFACTOR ✓"        │
 │  the component. I recommend     │   │  → Methodology: TDD enforced      │
 │  using Tailwind for styling..." │   │  → Tools: npm test → redir to    │
 │  [500 tokens]                   │   │    `| tail -30`, --silent flag   │
 │                                 │   │  → Tokens: 550 → 330 (-40%)     │
 │                                 │   │  → Quality: tested, not guessed  │
 │  ═══════════════════════════════ │   │  ════════════════════════════════ │
 │  Total: 800 tokens, untested    │   │  Total: 415 tokens, tested       │
 │  code, subtle bugs likely       │   │  code, methodology enforced       │
 │  Cost: ~$0.012 (Opus)          │   │  Cost: ~$0.006 (Opus)            │
 └─────────────────────────────────┘   └──────────────────────────────────┘
                  48% token reduction + tested code + faster workflow
```

---

## Claude Code — Full Feature Support (5/5)

Fusion Optimizer is **built for Claude Code first**. Every feature works:

| Feature | Status | How |
|---------|--------|-----|
| 8 Skills auto-discovery | ✅ | `skills/` dir auto-loaded |
| 5 lifecycle hooks | ✅ | SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, PreCompact |
| 22 tool routing patterns | ✅ | Auto-modifies git/npm/pip/test/curl commands |
| /compress memory files | ✅ | Deterministic 46% savings |
| /fusion-stats cost report | ✅ | Real-time token/cost estimates |
| Mode auto-detection | ✅ | SessionStart + per-turn re-evaluation |
| @zen / @quality / @balanced | ✅ | Instant mode switching |
| Cross-session memory | ✅ | `.fusion/memory.md` persistence |

### OpenCode & Other Agents (Optional)

OpenCode has native hook support via `.opencode/plugins/`. Cursor, Windsurf, Cline, Copilot work via `AGENTS.md`. Contributions to improve other agents welcome — see [Contributing](#contributing).

## Quick Install (30 seconds)

### Claude Code (Recommended)
```
/plugin marketplace add yagyarajsharma9/fusion-optimizer
/plugin install fusion-optimizer@fusion-optimizer-marketplace
```

```bash
git clone https://github.com/yagyarajsharma9/fusion-optimizer.git
cd fusion-optimizer
node scripts/install.js          # Auto-detects all agents on your machine
```

### Option 2: Per-Agent Manual Setup

**Claude Code:**
```
/plugin marketplace add yagyarajsharma9/fusion-optimizer
/plugin install fusion-optimizer@fusion-optimizer-marketplace
```
Or register locally:
```
/plugin marketplace add ./fusion-optimizer
/plugin install fusion-optimizer@fusion-optimizer
```

**Codex:**
Codex auto-discovers `.codex-plugin/` from project root. Clone into your workspace and restart.

**Cursor:**
Cursor auto-discovers `.cursor-plugin/` and reads `AGENTS.md`. Clone into workspace root.

**Gemini CLI:**
```bash
gemini extensions install https://github.com/yagyarajsharma9/fusion-optimizer
```

**OpenCode:**
Add to `opencode.json`:
```json
{ "plugin": ["fusion-optimizer@git+https://github.com/yagyarajsharma9/fusion-optimizer.git"] }
```

**Windsurf / Cline / Copilot:**
All read `AGENTS.md` from project root. Copy `AGENTS.md` to your project root folder.

---

## Quick Start

Once installed, Fusion Optimizer works automatically. Here's what to expect:

1. **Start any session** — Fusion detects your project complexity and sets initial mode
2. **Ask anything** — It auto-detects task complexity and adjusts mode per prompt
3. **Force mode** — Type `@zen`, `@quality`, or `@balanced` to override
4. **Check stats** — Run `/fusion-stats` to see your savings
5. **Compress memory** — Run `/compress` to permanently compress project files

### Verify Installation

**Claude Code:**
```
/fusion
```
Should show: `Mode: BALANCED | Turns: 1 | Skills: fusion-core`

**Any agent:**
Say "hello" or "what mode am I in" — Fusion should respond with `[BALANCED]` prefix.

---

## Three Operating Modes

### ZEN Mode (Cost-Optimized)
- **Output**: Caveman-ultra — fragments, no filler
- **Methodology**: None — just do the thing
- **Tool routing**: Active (22 patterns)
- **Use for**: Fixes, queries, searches, formatting
- **Command**: `@zen` or `/fusion-zen`

### BALANCED Mode (Default)
- **Output**: Caveman-lite — short sentences
- **Methodology**: TDD if coding, debug if bug
- **Tool routing**: Active (test output, git logs, large reads)
- **Use for**: Features, refactoring, medium bugs
- **Command**: `@balanced` or `/fusion-auto`

### QUALITY Mode (Methodology)
- **Output**: Caveman-lite — keep architecture explanations
- **Methodology**: Full — brainstorm → plan → TDD → review
- **Tool routing**: Off (methodology takes precedence)
- **Use for**: Architecture, migrations, new projects
- **Command**: `@quality` or `/fusion-quality`

---

## Commands

| Command | What It Does |
|---------|-------------|
| `/fusion` | Show current mode + quick stats |
| `/fusion-zen` | Force ZEN mode (max cost savings) |
| `/fusion-quality` | Force QUALITY mode (full methodology) |
| `/fusion-auto` | Let Fusion decide automatically |
| `/fusion-stats` | Detailed token/cost savings report |
| `/compress` | Permanently compress memory files (~46% smaller) |

---

## All Skills (8 Total)

| Skill | When It Activates | What It Does |
|-------|-------------------|-------------|
| `fusion-core` | Always (SessionStart) | Mode arbitration + task detection |
| `fusion-brainstorming` | QUALITY + design tasks | Lightweight design refinement |
| `fusion-tdd` | BALANCED/QUALITY + coding | RED-GREEN-REFACTOR (caveman output) |
| `fusion-debugging` | BALANCED/QUALITY + bugs | 4-phase root cause process |
| `fusion-review` | QUALITY + task complete | 5-point code review (compressed) |
| `fusion-memory` | Session start + explicit save | Cross-session persistent memory |
| `fusion-compress` | `/compress` command | Deterministic memory file compression |
| `fusion-stats` | `/fusion-stats` command | Session cost + savings reports |

---

## Expected Savings

| Mode | Output Reduction | Context Reduction | Net Cost Savings |
|------|-----------------|-------------------|-----------------|
| ZEN | ~65% | ~60% | ~40-55% |
| BALANCED | ~40% | ~30% | ~30-40% |
| QUALITY | ~25% | ~15% | ~15-25% |

**Plus**: `/compress` permanently cuts ~46% of input tokens from memory files — saves every session, forever. Run once.

---

## Testing

### Test Compress Script
```bash
node scripts/compress.js --dry-run    # See what would be compressed
node scripts/compress.js              # Compress all detected files
node scripts/compress.js --restore    # Restore from backups
```

### Test Hook Scripts
```bash
node hooks/sessionstart.js            # Tests mode detection
node hooks/pretooluse.js < test.json  # Tests tool routing (pipe JSON event)
node hooks/compress.js --file test.md # Tests single file compression
```

### Validate Plugin Manifests
```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf-8'))" && echo "OK"
node -e "JSON.parse(require('fs').readFileSync('.codex-plugin/plugin.json','utf-8'))" && echo "OK"
node -e "JSON.parse(require('fs').readFileSync('.cursor-plugin/plugin.json','utf-8'))" && echo "OK"
node -e "JSON.parse(require('fs').readFileSync('gemini-extension.json','utf-8'))" && echo "OK"
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf-8'))" && echo "OK"
```

---

## Architecture

```
fusion-optimizer/
├── .claude-plugin/plugin.json          # Claude Code manifest
├── .codex-plugin/plugin.json           # Codex manifest (with marketplace UI)
├── .cursor-plugin/plugin.json          # Cursor manifest
├── gemini-extension.json               # Gemini CLI extension
├── AGENTS.md                           # Universal cross-tool entry
├── CLAUDE.md                           # Claude Code think-in-code
├── GEMINI.md                           # Gemini context file
│
├── skills/                             # 8 skills (works with any skill system)
│   ├── fusion-core/SKILL.md            # Core arbitration + anti-loafing
│   ├── fusion-brainstorming/SKILL.md   # Lightweight design (caveman-friendly)
│   ├── fusion-tdd/SKILL.md             # RED-GREEN-REFACTOR
│   ├── fusion-debugging/SKILL.md       # 4-phase systematic debugging
│   ├── fusion-review/SKILL.md          # 5-point compressed review
│   ├── fusion-memory/SKILL.md          # Cross-session persistence
│   ├── fusion-compress/SKILL.md        # /compress — permanent memory compression
│   └── fusion-stats/SKILL.md           # Session cost reports
│
├── hooks/                              # 5 lifecycle hooks (Claude Code)
│   ├── hooks.json                      # Event registration
│   ├── sessionstart.js                 # Mode init + project detection
│   ├── pretooluse.js                   # 22 tool routing patterns
│   ├── posttooluse.js                  # Stats tracking + size warnings
│   ├── userpromptsubmit.js             # Per-turn mode re-evaluation
│   └── precompact.js                   # Session continuity snapshot
│
├── commands/                           # 6 slash commands
│   ├── fusion.md
│   ├── fusion-zen.md
│   ├── fusion-quality.md
│   ├── fusion-auto.md
│   ├── fusion-stats.md
│   └── compress.md
│
├── src/                                # Core libraries (Node.js, zero deps)
│   ├── arbitrator.js                   # Mode selection engine (50+ patterns)
│   ├── compressor.js                   # Output compression rules
│   ├── router.js                       # Tool routing reference
│   ├── stats.js                        # Token/cost estimation
│   └── memory.js                       # Persistent memory manager
│
├── scripts/
│   ├── install.js                      # Universal one-command installer
│   └── compress.js                     # Deterministic memory file compressor
│
├── .claude/settings.json               # Safe permission defaults
├── .gitignore
├── README.md                           # This file
└── LICENSE                             # MIT
```

---

## Tool Routing Patterns (22 Rules)

Automatically applied in ZEN and BALANCED modes:

| Category | Command | Modification |
|----------|---------|-------------|
| **Git** | `git log` unbounded | → `--oneline -n 30` |
| | `git diff` unbounded | → `--stat` |
| | `git blame` unbounded | → `\| head -50` |
| | `git show` unbounded | → `--stat` |
| **Packages** | `npm install/ci/update` | → `--silent` |
| | `yarn install/add` | → `--silent` |
| | `pnpm install/add` | → `--silent` |
| | `pip install` | → `-q` |
| | `cargo build/install` | → `-q \| tail -20` |
| | `go get/install` | → `\| tail -20` |
| **Tests** | `jest/vitest` | → `\| tail -30` |
| | `pytest` | → `-q --tb=short \| tail -30` |
| | `go test` | → `\| tail -30` |
| | `cargo test` | → `-q \| tail -30` |
| **Build** | `make` | → `-s \| tail -20` |
| | `docker build` | → `-q` |
| **HTTP** | `curl` verbose | → WARN (use WebFetch) |
| | `wget` verbose | → WARN (use WebFetch) |
| **Files** | `find` unbounded | → WARN (use -maxdepth) |
| | `ls -R` | → WARN (use Glob) |
| | `cat` | → WARN (use Read+offset) |

---

## Troubleshooting

### Plugin Not Loading (Claude Code)
```
/plugin list                              # Verify installed
/plugin marketplace list                  # Verify marketplace registered
```
Manually add marketplace: `/plugin marketplace add ./fusion-optimizer`

### Skills Not Detected
Skills auto-discover from `skills/` directory. Verify structure:
```bash
ls skills/fusion-core/SKILL.md    # Should exist
```

### Hooks Not Firing
Check `hooks/hooks.json` is valid JSON. Check Node.js >= 18:
```bash
node --version                    # Should be >= 18.x
node hooks/sessionstart.js        # Should exit without errors
```

### Compress Script Errors
```bash
node scripts/compress.js --dry-run  # Test without writing
node scripts/compress.js --restore  # Undo all compressions
```

### Mode Not Auto-Detecting
Type `@zen`, `@quality`, or `@balanced` to force mode. Check mode in `/fusion` output.

---

## Requirements

| Requirement | Why | What Happens Without It |
|------------|-----|------------------------|
| Claude Code | Plugin target | N/A — this is the host |
| Node.js >= 18 | Hook scripts | Hooks silently skip. **Skills + commands still work.** Plugin still loads. |
| Git (for install) | Clone marketplace | Install manually by copying `skills/` and `commands/` |

**Graceful degradation**: If Node.js is missing, Fusion Optimizer still works — just without automatic mode detection, tool routing, and stats tracking. The 8 skills and 6 commands (which are the core value) are pure markdown and always work.

## Contributing

**This plugin is built for Claude Code first.** OpenCode and other agents are supported but may lack some features. We welcome contributions for:

- Cursor plugin hooks (`.cursor-plugin/` integration)
- Copilot extensions
- Gemini CLI improvements
- Windsurf/Cline agent configurations
- Additional tool routing patterns
- New compression rules for the `/compress` script

### How to contribute:
1. Fork the repository
2. Create a branch for your change
3. Follow the `fusion-core` skill patterns
4. Test with `node scripts/compress.js --dry-run`
5. Submit a PR — mention which agent you're targeting

## License

MIT — free like mass mammoth on open plain.

## Author

- **GitHub**: [yagyarajsharma9](https://github.com/yagyarajsharma9)
- **Email**: yagyarajsharma9@gmail.com
