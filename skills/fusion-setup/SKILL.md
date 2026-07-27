---
name: fusion-setup
description: One-time interactive model configuration wizard. Asks which models to use for ZEN/BALANCED/QUALITY tiers. Saves permanently. Activates on first plugin install or /fusion-setup command.
---

# Fusion Setup — Model Configuration Wizard

Activate when: user says "/fusion-setup", "setup fusion", "configure models", "accept models", "change model configuration", OR first-run detection injects setup prompt.

## Goal

Configure which models Fusion Optimizer uses for each task tier. All answers saved permanently to `.fusion/model-config.json`.

## The 3 Questions (ask one at a time)

### Q1: ZEN Tasks (simple fixes, searches, formatting)
Which model for cheapest work?
```
Current: <read from .fusion/model-config.json, or default>
Options:
  [1] claude-haiku-4-5 (Haiku)      ← default (fast, cheap)
  [2] claude-sonnet-5 (Sonnet)      (mid)
  [3] claude-opus-4-8 (Opus)        (best, expensive)
  [4] Custom: type any model ID
```

### Q2: BALANCED Tasks (features, refactoring, medium bugs)
Which model for mid-tier work?
```
Current: <from config or default>
Options: same format as Q1, default changes to Sonnet
```

### Q3: QUALITY Tasks (architecture, design, complex bugs)
Which model for premium work?
```
Current: <from config or default>
Options: same format, default Opus
```

### Q4: Main Conversation Model
Which model for your main Claude Code session?
```
Current: <from config or default>
Options: same format
```

## Quick Accept

User can say "accept defaults" at any point to skip remaining questions and use defaults.

## Shortcut Answers

| User says | Action |
|-----------|--------|
| "accept defaults" | Skip to save with all defaults |
| "1" or "haiku" | Select option 1 for current question |
| "2" or "sonnet" | Select option 2 |
| "3" or "opus" | Select option 3 |
| "use gemini" | Custom: gemini/gemini-flash |
| "use deepseek" | Custom: deepseek/deepseek-chat |
| Any valid model ID | Set as custom model |

## Save and Confirm

```
✅ Model configuration saved!

  ZEN:      claude-haiku-4-5 (Haiku)   — 97% cheaper than baseline
  BALANCED: claude-sonnet-5 (Sonnet)    — 85% cheaper than baseline
  QUALITY:  claude-opus-4-8 (Opus)     — baseline
  MAIN:     claude-opus-4-8 (Opus)

  Config: .fusion/model-config.json
  Change anytime: run /fusion-setup again.
  Models persist across all sessions in this project.
```

## Important

1. Update `.fusion/model-config.json` file after EVERY answer, not just at end
2. Set `setup_complete: true` and `setup_date: <ISO date>` when done
3. Config is project-specific (`.fusion/` in project root). Different projects can have different models.
