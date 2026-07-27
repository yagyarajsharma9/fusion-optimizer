# PROJECT.md — Fusion Optimizer: Complete Developer & LLM Reference

> **Read this first if you're an LLM or developer working on this project.**
> Single source of truth. Everything you need to understand, test, modify, or extend.

---

## 1. What Is This?

Fusion Optimizer is a **Claude Code plugin** (primary) that intelligently balances **quality methodology** (Superpowers-style TDD, brainstorming, code review) with **cost optimization** (Caveman-style output compression, context-mode-style tool routing). It auto-detects task complexity and selects one of three modes:

| Mode | When | Output Style | Methodology | Savings |
|------|------|-------------|-------------|---------|
| **ZEN** | Fix typo, rename, find, explain | Caveman-ultra (fragments) | None | ~65% output, ~60% context |
| **BALANCED** | Add feature, refactor, fix bug | Caveman-lite (short sent.) | TDD + Debug | ~40% output, ~30% context |
| **QUALITY** | Design, migrate, new project | Caveman-lite (preserve) | Full SDLC | ~25% output, ~15% context |

**Secondary support**: OpenCode (native hooks), Cursor/Windsurf/Cline/Copilot (AGENTS.md only).

---

## 2. Quick Facts

| Fact | Value |
|------|-------|
| **Language** | JavaScript (hooks), Markdown (skills/commands) |
| **Runtime** | Node.js >= 18 (hooks only; skills work without) |
| **Dependencies** | Zero. Uses only Node.js built-ins: `fs`, `path` |
| **Package manager** | None. No `npm install` needed |
| **Repo** | https://github.com/yagyarajsharma9/fusion-optimizer |
| **Author** | yagyarajsharma9 / yagyarajsharma9@gmail.com |
| **License** | MIT |
| **Stars/Downloads** | 0 — brand new, just published |
| **Tested on** | Windows 11, Claude Code 2.1.220, OpenCode 1.18.7 |

---

## 3. Complete File Map

Every file in the repo, what it does, why it exists, and how to modify it.

### 3.1 Plugin Manifests (5 files — one per agent)

```
.claude-plugin/
├── plugin.json          → Claude Code manifest. name, description, commands path.
│                          No "hooks" or "skills" field — both auto-discovered!
│                          If adding commands: update the commands array.
└── marketplace.json     → Marketplace catalog. Lists this plugin. Rarely changed.

.codex-plugin/
└── plugin.json          → Codex manifest. Has "interface" section for marketplace UI.
│                          URLs must point to the GitHub repo. Update version here.

.cursor-plugin/
└── plugin.json          → Cursor manifest. Simpler than Claude/Codex. skills path only.

gemini-extension.json     → Gemini CLI extension. Just name + contextFileName.
```

### 3.2 Universal Entry Points (3 files)

```
AGENTS.md                → THE universal cross-tool instruction file.
│                          Read by: Cursor, Windsurf, Cline, Copilot, OpenCode.
│                          Contains: mode rules, detection table, anti-patterns.
│                          Update this when adding new modes or changing rules.

CLAUDE.md                → Claude Code think-in-code file.
│                          Auto-injected into Claude Code context.
│                          Contains: architecture overview, maintainer notes.

GEMINI.md                → Gemini CLI context file.
│                          Referenced by gemini-extension.json.
│                          Lighter version of AGENTS.md for Gemini.
```

### 3.3 Skills (8 directories × 1 file each)

All skills are in `skills/<name>/SKILL.md`. Each is a markdown file with YAML frontmatter.

```
skills/
├── fusion-core/SKILL.md         → THE CORE. Always loaded.
│   Content: 3-mode rules, detection table, anti-loafing check.
│   WARNING: This is the most critical file. Changes here affect ALL modes.
│   Last bug fix: ZEN mode "Just do it" → added "Do it completely" rule.
│
├── fusion-brainstorming/SKILL.md → QUALITY mode design refinement.
│   Lightweight version of Superpowers' brainstorming skill.
│   Caveman-friendly: <500 words, short sections, 1-2 questions max.
│
├── fusion-tdd/SKILL.md           → BALANCED/QUALITY mode. RED-GREEN-REFACTOR.
│   Enforces: test-first, never code before test, one assertion per test.
│   Output format: "RED: test_name fails ✓ → GREEN: passes ✓ → REFACTOR ✓"
│
├── fusion-debugging/SKILL.md     → 4-phase systematic debugging.
│   Phases: REPRODUCE → ISOLATE → FIX → VERIFY.
│   Context-mode integration for log/tool output.
│
├── fusion-review/SKILL.md        → QUALITY mode code review.
│   5-check: spec, correctness, tests, quality, security.
│   Output: "L42: 🔴 spec: missing pagination param"
│   Max 5 comments per review.
│
├── fusion-memory/SKILL.md        → Cross-session persistence.
│   Saves to .fusion/memory.md. Auto-saves on decisions, bugs, session end.
│   Loads on SessionStart. Keeps file <200 lines.
│
├── fusion-compress/SKILL.md      → /compress command — permanent compression.
│   Rewrites memory files to caveman-speak. ~46% smaller.
│   Safety: backups, never compresses config/env files.
│   Two implementations: LLM-based (skill) + deterministic (scripts/compress.js)
│
└── fusion-stats/SKILL.md         → /fusion-stats — cost report.
    Displays: mode distribution, token estimates, cost comparison.
    Estimate constants: ZEN=65%, BALANCED=40%, QUALITY=25%.
    Pricing: $15/M input, $75/M output (Opus rates).
```

### 3.4 Commands (6 files)

```
commands/
├── fusion.md             → /fusion — show current mode + stats
├── fusion-zen.md         → /fusion-zen — force ZEN mode
├── fusion-quality.md     → /fusion-quality — force QUALITY mode
├── fusion-auto.md        → /fusion-auto — let system decide
├── fusion-stats.md       → /fusion-stats — detailed cost report
└── compress.md           → /compress — permanently compress memory files
```

Each file is a markdown description. Claude Code auto-registers these as slash commands. The LLM reads the description and executes accordingly.

### 3.5 Hooks — Claude Code Runtime (6 files)

These are Node.js scripts executed by Claude Code's hook system. **They need Node.js >= 18.**

```
hooks/
├── hooks.json             → Hook registration file.
│   FORMAT: {"hooks": {"EventName": [{"hooks": [{"type":"command","command":"...","timeout":N}]}]}}
│   CRITICAL: Each event entry MUST have {"hooks": [...]} wrapper!!
│   List of events registered: SessionStart, PreToolUse, PostToolUse,
│     UserPromptSubmit, PreCompact
│
├── stdin-helper.js        → Shared utility for reading piped JSON.
│   Dual fallback: fd 0 then /dev/stdin. Handles Windows/Mac/Linux.
│   All hooks that read stdin must import this.
│
├── sessionstart.js        → SessionStart hook — fires once at session begin.
│   What it does:
│   1. Reads CLAUDE_PLUGIN_ROOT env var or falls back to __dirname/..
│   2. Creates .fusion/ directory for state storage
│   3. Detects project complexity (file count, dirs, package.json)
│   4. Creates .fusion/memory.md if not exists
│   5. Outputs JSON with initial mode for context injection
│   State file: .fusion/session.json
│
├── pretooluse.js          → PreToolUse hook — fires before every tool call.
│   What it does:
│   1. Reads current mode from .fusion/session.json
│   2. In QUALITY mode: passes through (methodology > routing)
│   3. In ZEN/BALANCED: checks 22 routing rules
│   4. If match: modifies command or warns
│   5. Outputs JSON: decision + modifiedInput + warning
│   Rules defined inline. To add new rules: add to the `rules` array.
│
├── posttooluse.js         → PostToolUse hook — fires after tool execution.
│   What it does:
│   1. Tracks tool call count and output size
│   2. Saves stats to .fusion/session.json
│   3. In ZEN mode: warns if output >5KB
│   Used by fusion_stats custom tool in OpenCode.
│
├── userpromptsubmit.js    → UserPromptSubmit hook — fires per prompt.
│   What it does:
│   1. Re-evaluates mode from prompt text
│   2. Detects explicit mode requests (@zen, @quality, @balanced)
│   3. Detects task complexity (28 trivial patterns, 14 complex patterns)
│   4. Auto-escalation: 3+ failures → QUALITY
│   5. Saves updated state to .fusion/session.json
│   6. Outputs mode context for injection
│
└── precompact.js          → PreCompact hook — fires before context compaction.
    What it does:
    1. Saves session snapshot to .fusion/snapshot.json
    2. Updates .fusion/memory.md with session checkpoint
    3. Trims memory if >200 lines (archives old entries)
    4. Outputs resume context for post-compaction injection
```

### 3.6 Core Libraries (5 files)

```
src/
├── arbitrator.js          → Mode selection engine. 155 lines.
│   Exports: MODES, determineMode(), analyzeComplexity(), pickSkills()
│   Complexity patterns: 28 trivial, 14 complex (both regex-based)
│   Mode mapping: TRIVIAL→ZEN, MODERATE→BALANCED, COMPLEX→QUALITY
│   Also detects explicit overrides: @zen, @quality, @balanced
│
├── compressor.js          → Output compression rule definitions.
│   Exports: levels (LITE, ULTRA, CODE_REVIEW, COMMIT)
│   Contains: regex patterns + replacement tables
│   LITE: drops "I think", "you should" → "use", ~40% reduction
│   ULTRA: fragments, no articles, status symbols, ~65% reduction
│   CODE_REVIEW: L{line}: {emoji} {severity}: {desc}, max 5
│   COMMIT: {type}({scope}): {≤50 char desc}
│
├── router.js              → Tool routing reference (NOT used at runtime).
│   Exports: ROUTING_PATTERNS (documentation of all 22 rules)
│   Runtime logic is in hooks/pretooluse.js (duplicated intentionally —
│     hooks must be standalone, no require() calls to src/)
│
├── stats.js               → Token/cost estimation logic.
│   Exports: calculateStats(), readSessionState()
│   Estimates based on mode distribution × avg tokens/turn
│   Pricing: Opus $15/M input, $75/M output (hardcoded)
│   Used by: /fusion-stats command, OpenCode fusion_stats tool
│
└── memory.js              → Persistent memory manager.
    Exports: saveDecision(), saveGotcha(), updateActiveContext(), readMemory()
    File: .fusion/memory.md (markdown, 200-line max)
    Auto-trim + archive: .fusion/memory-archive.md
```

### 3.7 Scripts (2 files)

```
scripts/
├── install.js             → Universal installer. 200+ lines.
│   Auto-detects 7+ agents: Claude Code, Codex, Cursor, Gemini,
│     Windsurf, Cline, Copilot
│   For each: runs install command or copies AGENTS.md
│   Options: --dry-run, --agent claude-code,cursor
│   Always copies AGENTS.md to project root (universal entry)
│
└── compress.js            → Deterministic memory file compressor. 400+ lines.
    Node.js script: rewrites CLAUDE.md/AGENTS.md to caveman-speak.
    50+ regex rules. Code blocks, URLs, inline code fully protected.
    Options: --dry-run, --file CLAUDE.md, --restore
    Creates .bak backups. ~28-46% size reduction.
    USAGE: node scripts/compress.js
```

### 3.8 Config & Docs (5 files)

```
.claude/settings.json     → Safe permission defaults for Claude Code.
.                        Allows: mkdir, mv, cp, rm, touch, git, echo, Read, Write, Edit, Glob, Grep
.                        Denies: sudo, rm -rf /*, rm -rf ~

.gitignore               → Excludes: node_modules, lock files, .fusion, .bak, .env

README.md                → User-facing documentation with diagrams
PLUGIN_RESEARCH.md       → Deep analysis of 6 competing plugins (412 lines)
FUSION_OPTIMIZER_DESIGN.md → Architecture and design decisions
PILOT_TEST_REPORT.md     → Live test results with reliability scores
```

---

## 4. How to Test This Project

### Quick Validate (no Claude Code needed)

```bash
# Validate all manifests
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf-8'))"
node -e "JSON.parse(require('fs').readFileSync('.codex-plugin/plugin.json','utf-8'))"
node -e "JSON.parse(require('fs').readFileSync('.cursor-plugin/plugin.json','utf-8'))"
node -e "JSON.parse(require('fs').readFileSync('gemini-extension.json','utf-8'))"
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf-8'))"

# Test hooks in isolation
node hooks/sessionstart.js
echo '{"tool_name":"Bash","tool_input":{"command":"git log"}}' | node hooks/pretooluse.js

# Test compress script
node scripts/compress.js --dry-run

# Test arbitrator
node -e "const a=require('./src/arbitrator.js');console.log(a.analyzeComplexity('fix typo'))"
```

### Claude Code Test

```bash
# Install
claude plugin marketplace add yagyarajsharma9/fusion-optimizer
claude plugin install fusion-optimizer@fusion-optimizer-marketplace

# Verify
claude plugin list  # Should show: Status: √ enabled

# Run prompts (needs credits)
claude -p "@zen fix the typo on line 5 of src/index.js"
claude -p "add a login endpoint to the API"
```

### OpenCode Test

```bash
# Copy .opencode/plugins/ to project
cp -r fusion-optimizer/.opencode/ my-project/.opencode/

# Run prompts
opencode run -m deepseek/deepseek-v4-flash "git log"
# Should output: git log --oneline -n 30 (auto-routed!)
```

---

## 5. How to Modify This Project

### Adding a New Skill

1. Create `skills/<name>/SKILL.md`
2. YAML frontmatter: `name`, `description`, `mode` (optional)
3. Content: follow the caveman-friendly style (short, direct, no filler)
4. Skills auto-discover — no manifest update needed
5. Test: skill should appear in Claude Code skill list

### Adding a New Hook Event

1. Add entry to `hooks/hooks.json` with `{"hooks": [...]}` wrapper
2. Create `hooks/<eventname>.js`
3. Import `stdin-helper.js` if reading piped data
4. Output valid JSON to stdout for context injection
5. Test in isolation: pipe JSON to the script

### Adding a New Command

1. Create `commands/<name>.md`
2. Content: brief description, usage, what it does
3. Commands auto-discover from `commands/` dir
4. No manifest update needed

### Changing Mode Detection Patterns

1. Edit `src/arbitrator.js` — complexity patterns
2. Edit `hooks/userpromptsubmit.js` — duplicate patterns (hooks are standalone)
3. Edit `skills/fusion-core/SKILL.md` — rule descriptions
4. Test: `node -e "require('./src/arbitrator.js').analyzeComplexity('your test prompt')"`

### Changing Tool Routing Rules

1. Edit `hooks/pretooluse.js` — the `rules` array
2. Update `src/router.js` — reference documentation
3. Test: pipe JSON to `hooks/pretooluse.js`

### Changing Compression Rules

1. Edit `scripts/compress.js` — `COMPRESSION_RULES` array
2. Edit `src/compressor.js` — reference rules
3. Test: `node scripts/compress.js --dry-run --file AGENTS.md`

---

## 6. Design Decisions — Why Things Are The Way They Are

### Decision 1: Skills are markdown, hooks are Node.js

**Why**: Skills are LLM instructions — any agent can read them. Hooks are runtime enforcement — needs a runtime. Markdown works everywhere. Node.js works on all OSes. Python would add a second dependency. Bash wouldn't work on Windows.

### Decision 2: Hooks duplicate logic from src/

**Why**: Claude Code hooks must be standalone. They can't `require()` files from `src/` because the `${CLAUDE_PLUGIN_ROOT}` path resolves at runtime. The hooks read from environment variables, not relative paths. So `pretooluse.js` has its own copy of the routing rules rather than importing from `src/router.js`.

**Exception**: `stdin-helper.js` is shared because it's in the same `hooks/` directory.

### Decision 3: hooks.json needs `{"hooks": [...]}` wrapper

**Why**: Claude Code's hook schema requires it. Each event entry must have sub-arrays for hooks. Without this wrapper, all 5 hooks fail with "expected array, received undefined". This was discovered during live testing.

### Decision 4: No hooks field in plugin.json

**Why**: Claude Code auto-loads `hooks/hooks.json` from the plugin root. If `plugin.json` also references it, you get "Duplicate hooks file detected". The hooks field in plugin.json is for ADDITIONAL hook files only.

### Decision 5: Skills and commands auto-discover

**Why**: Claude Code auto-discovers `skills/` and `commands/` directories. No path overrides in plugin.json needed. This makes the plugin structure clean and convention-based.

### Decision 6: Claude-first, others optional

**Why**: Claude Code has the richest plugin system (hooks, skills, commands, agents). OpenCode has hooks but uses a different format. Cursor/Copilot only read AGENTS.md. Building full parity for all agents would require 4x the maintenance. We focus on Claude Code and welcome contributions for others.

### Decision 7: Zero npm dependencies

**Why**: Professional plugins don't bundle packages. Node.js built-ins (`fs`, `path`) cover all our needs. No `npm install`, no `node_modules`, no `package-lock.json`. Same as Caveman, Superpowers, and Anthropic's official plugins.

---

## 7. Cross-Agent Feature Matrix

| Feature | Claude Code | OpenCode | Cursor | Copilot | Gemini | Windsurf/Cline |
|---------|------------|----------|--------|---------|--------|----------------|
| Skills (8) | ✅ auto | ✅ via opencode.json | ✅ | ❌ | ✅ | ❌ |
| Commands (6) | ✅ auto | ❌ | ❌ | ❌ | ❌ | ❌ |
| Hooks (5) | ✅ native | ✅ native (.opencode) | ❌ | ❌ | ❌ | ❌ |
| Tool routing (22) | ✅ PreToolUse | ✅ tool.execute.before | ❌ | ❌ | ❌ | ❌ |
| Mode auto-detect | ✅ UserPromptSubmit | ❌ | ❌ | ❌ | ❌ | ❌ |
| /compress (script) | ✅ hooks | ✅ hooks | ❌ | ❌ | ❌ | ❌ |
| /compress (LLM) | ✅ skill | ✅ skill | ✅ AGENTS.md | ✅ AGENTS.md | ✅ GEMINI.md | ✅ AGENTS.md |
| Cross-session memory | ✅ PreCompact | ✅ compacting hook | ✅ AGENTS.md | ✅ AGENTS.md | ✅ GEMINI.md | ✅ AGENTS.md |
| fusion_stats | ✅ command | ✅ custom tool | ❌ | ❌ | ❌ | ❌ |

---

## 8. Known Issues & Edge Cases

### Issue 1: ZEN mode can be too terse
- **Symptom**: Rename/refactor tasks only change one occurrence
- **Fix applied**: Added "Do it completely. Use replace_all. Verify." to fusion-core
- **Still possible**: If agent ignores AGENTS.md instructions
- **Mitigation**: Use BALANCED mode for any task involving code changes

### Issue 2: Hooks silently fail without Node.js
- **Symptom**: No auto-detection, no tool routing
- **Impact**: Skills and commands still work. Plugin still loads.
- **Detection**: `claude plugin list` shows "√ enabled" (hooks skipped silently)
- **Fix**: Install Node.js >= 18

### Issue 3: Claude Code credits needed for live testing
- **Symptom**: Can't run `claude -p "prompt"` without credits
- **Workaround**: Test hooks in isolation, validate manifests, use OpenCode for prompts
- **Verification**: `claude plugin list` confirms plugin loads correctly

### Issue 4: Windows CRLF vs Unix LF
- **Symptom**: Git warnings about line endings
- **Impact**: None — modern Node.js handles both
- **Note**: All files authored on Windows, may show CRLF warnings on clone

### Issue 5: Marketplace cache staleness
- **Symptom**: Plugin changes not reflected after push
- **Fix**: 
  ```bash
  claude plugin marketplace remove fusion-optimizer-marketplace
  Remove-Item -Recurse ~/.claude/plugins/cache/fusion-optimizer-marketplace
  claude plugin marketplace add yagyarajsharma9/fusion-optimizer
  claude plugin install fusion-optimizer@fusion-optimizer-marketplace
  ```

---

## 9. File Count & Size Summary

| Category | Files | Total Lines | Primary Language |
|----------|-------|------------|-----------------|
| Manifests | 5 | ~120 | JSON |
| Skills | 8 | ~600 | Markdown |
| Commands | 6 | ~110 | Markdown |
| Hooks | 6 | ~700 | JavaScript |
| Core libs | 5 | ~650 | JavaScript |
| Scripts | 2 | ~600 | JavaScript |
| Docs | 5 | ~1,500 | Markdown |
| Config | 2 | ~20 | JSON |
| **Total** | **39** | **~4,300** | |

---

## 10. Quick Reference — Common Commands

```bash
# Install in Claude Code
claude plugin marketplace add yagyarajsharma9/fusion-optimizer
claude plugin install fusion-optimizer@fusion-optimizer-marketplace

# Verify
claude plugin list

# Test hooks
node hooks/sessionstart.js
echo '{"tool_name":"Bash","tool_input":{"command":"npm install"}}' | node hooks/pretooluse.js

# Compress memory files
node scripts/compress.js --dry-run
node scripts/compress.js

# Run arbitrator
node -e "const a=require('./src/arbitrator.js');
  console.log('fix typo →', a.analyzeComplexity('fix a typo'));
  console.log('add login →', a.analyzeComplexity('add login form'));
  console.log('design API →', a.analyzeComplexity('design REST API'))"

# Git workflow
git add -A
git commit -m "fix: description"
git push origin master
```

---

## 11. Future Roadmap

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| High | Real token tracking (read Claude Code session logs) | 2 days | Accurate stats |
| High | Status line integration (show mode in terminal) | 1 day | UX |
| Medium | Cursor hook support (`.cursor/hooks/`) | 3 days | Cross-agent |
| Medium | Self-learning feedback (track which compressions work) | 5 days | Smarter routing |
| Low | Copilot extension | 2 days | Cross-agent |
| Low | Gemini hook integration | 2 days | Cross-agent |
| Low | Team memory sharing (like claude-mem-sync) | 5 days | Collaboration |

---

## 12. Paper Trail

All research and design documents in the parent directory:

| Document | Content |
|----------|---------|
| `PLUGIN_RESEARCH.md` | Deep analysis of 6 competing plugins (Superpowers, Caveman, Context-Mode, Headroom, Token-Optimizer, Claude-Mem) |
| `FUSION_OPTIMIZER_DESIGN.md` | Architecture design, mode arbitration math, token budget estimates |
| `PILOT_TEST_REPORT.md` | Live test results on OpenCode + DeepSeek Flash, reliability scores |

---

## 13. Verification — All Tests Passing

Verified on **Claude Code 2.1.220**, **OpenCode 1.18.7**, **Windows 11**, **Node.js 24.17**.

| Category | Count | Result |
|----------|-------|--------|
| JSON Manifests | 6/6 valid | ✅ |
| Skills present | 10/10 | ✅ |
| Commands present | 7/7 | ✅ |
| Agents present | 3/3 | ✅ |
| Hook scripts | 7/7 | ✅ |
| Core libraries | 5/5 | ✅ |
| Documentation | 5/5 | ✅ |
| PreToolUse routing | 4/4 correct | ✅ |
| Arbitrator detection | 16/16 correct | ✅ |
| Compress savings | 45% | ✅ |
| Model config | Valid default | ✅ |
| Claude Code load | `√ enabled`, zero errors | ✅ |
| OpenCode plugin | `.opencode/plugins/` valid | ✅ |

**Last verified**: 2026-07-28 | **Commit**: `80db3d7`

---

*Last updated: 2026-07-28 | Maintainer: yagyarajsharma9 | Version: 1.0.0*
