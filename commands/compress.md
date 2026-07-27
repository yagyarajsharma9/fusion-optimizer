# /compress — Compress Memory Files

Permanently compress project memory files (CLAUDE.md, AGENTS.md, GEMINI.md) into caveman-speak — cutting ~46% input tokens every session forever.

## Usage

/compress

Or: "compress my memory files", "cavemanize CLAUDE.md", "make memory smaller"

## What It Does

Scans your project for memory/instruction files and rewrites them:
- Removes conversational filler ("I think", "let me", "you should")
- Preserves ALL code, paths, identifiers, URLs, error messages
- Keeps structure (headings, lists, code fences) intact
- Creates `.bak` backups before modifying

## Which Files

Auto-detects: CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules, .windsurfrules, MEMORY.md, copilot-instructions.md

## Safety

- Always creates backups (`.bak` files)
- Never compresses config files (JSON, YAML, TOML)
- Never compresses `.env` files
- Asks confirmation if >5 files found
- Run "restore backups" to undo

## Example Output
```
Compressed 3 files:
CLAUDE.md:   1,234B → 678B (45%)
AGENTS.md:   2,100B → 1,097B (48%)
GEMINI.md:     890B → 510B (43%)
Total: ~2.4k input tokens saved per session
Backups at *.md.bak
```
