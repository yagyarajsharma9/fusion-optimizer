---
name: fusion-compress
description: Permanently compress project memory files (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules, etc.) into caveman-speak. Cuts ~46% input tokens every session after. Activates with /compress command.
---

# Fusion Compress

Activate when: user runs `/compress`, or says "compress my memory files", "compress CLAUDE.md", "make memory smaller", "optimize memory files", "cavemanize my config".

## What It Does

Rewrites project memory/configuration files into caveman-speak:
- Drops conversational filler: "I think", "let me", "should", "would like to"
- Preserves ALL: code blocks, file paths, identifiers, URLs, error messages, configuration values
- Keeps structure: headings, lists, code fences intact
- Result: same information, ~46% fewer input tokens, saved EVERY session forever

## Which Files to Compress

Auto-detect and compress these files (if present):
1. `CLAUDE.md` — Claude Code project context
2. `AGENTS.md` — Cross-tool agent instructions  
3. `GEMINI.md` — Gemini CLI context
4. `.cursorrules` or `.cursor/rules/*` — Cursor rules
5. `.windsurfrules` — Windsurf rules
6. `README.md` — only if it contains instructions for AI agents
7. `.github/copilot-instructions.md` — GitHub Copilot instructions
8. `MEMORY.md` — Memory files
9. `.fusion/memory.md` — Our own memory file

## Compression Rules

### REMOVE these patterns:
```
"I think", "I believe", "In my opinion"
"Let me", "Let's", "I'll go ahead and"
"Sure!", "Great question!", "Absolutely!"
"you should" → "use"
"I recommend" → "recommend"
"I suggest" → "suggest"
"this is because" → "because"
"in order to" → "to"
"due to the fact that" → "because"
"at this point in time" → "now"
"a number of" → "several"
"the majority of" → "most"
"is able to" → "can"
"is responsible for" → "handles"
"has the ability to" → "can"
"please", "kindly", "thank you" — conversational politeness
"note that", "it is important to note that" — unnecessary emphasis
```

### PRESERVE exactly (never compress):
- Code blocks (everything inside triple backticks)
- File paths (`src/main.js`, `/etc/config`)
- Identifiers, class names, function names
- URLs (https://...)
- Configuration values, env vars
- Error messages
- Version numbers
- Git commands, shell commands
- Headings (`#`, `##`, etc.)
- List markers (`-`, `*`, `1.`)

### REPLACE verbose with terse:
```
"You should always use" → "Always use"
"It is recommended to" → "Use"
"When you are working with" → "With"
"In the event that" → "If"
"Make sure to" → "Ensure"
"If you want to" → "To"
"You need to make sure" → "Ensure"
"For the purpose of" → "For"
"With regard to" → "About"
"In the context of" → "In"
```

## Process

### Step 1: Identify files
List all compressible files in the project root.

### Step 2: Backup
Copy each file to `filename.md.bak` before modifying.

### Step 3: Compress
For each file:
- Read entire content
- Apply compression rules
- Preserve code blocks, paths, identifiers
- Write compressed version back

### Step 4: Report
Show before/after stats:
```
Compressed CLAUDE.md: 1,234 → 678 bytes (45% smaller)
Compressed AGENTS.md: 2,100 → 1,120 bytes (47% smaller)
Total: 3,334 → 1,798 bytes (46% smaller)
Estimated savings: ~2k input tokens per session
Backups: CLAUDE.md.bak, AGENTS.md.bak
```

### Step 5: Verify
Read compressed file. Confirm:
- All code blocks intact
- All file paths intact
- All URLs intact
- Structure preserved (headings, lists)

## Safety Rules
- ALWAYS backup before compressing (create `.bak` files)
- NEVER compress `.env`, `.env.*`, `package.json`, `tsconfig.json`
- NEVER compress configuration files that are machine-read (JSON, YAML, TOML config)
- ONLY compress markdown files that contain human/AI instructions
- Ask confirmation before compressing if >5 files found

## Output Format
```
[ZEN] Compressed 3 files:
CLAUDE.md:   1,234B → 678B (45%)
AGENTS.md:   2,100B → 1,097B (48%)  
GEMINI.md:     890B → 510B (43%)
Total saved: 939B (46%) — ~2.4k input tokens per session
Backups at: *.md.bak. Run "restore backups" to undo.
```
