---
name: fusion-setup
description: One-time model config. Choose models for ZEN/BALANCED/QUALITY. Saves permanently. Custom model [4] = type any ID — if not found at runtime, auto-falls back to default.
---

# Fusion Setup — Model Configuration

Activate on: "/fusion-setup", "setup fusion", "configure models", "accept models", first-run prompt.

## Goal

Pick which models Fusion uses. Saved permanently. Change anytime.

## How Auto + Manual Works (Both)

```
AUTO (default)                          MANUAL (override)
─────────────                           ─────────────────
"rename file" → ZEN → Haiku            "@zen rename file" → force ZEN
"add feature" → BAL → Sonnet           "@quality fix bug" → force QUALITY
"design arch" → QUAL → Opus            "@balanced" → force BALANCED
```

**Auto switching is always ON.** Manual override is temporary (one prompt only). Both work together — no conflict.

## The Questions (one at a time)

### Q1: ZEN — Simple tasks (fixes, searches, rename, format)
```
  [1] claude-haiku-4-5   ← default (fastest, cheapest)
  [2] claude-sonnet-5     (mid)
  [3] claude-opus-4-8     (best, expensive)
  [4] Custom: type any model ID (e.g., "deepseek-chat", "gemini-flash")
      → If model doesn't exist when I try to use it,
        I'll auto-fall-back to [1] claude-haiku-4-5.
```

### Q2: BALANCED — Feature work (implement, refactor, tests)
```
  [1] claude-sonnet-5     ← default (balanced)
  [2] claude-opus-4-8     (premium)
  [3] claude-haiku-4-5    (cheap)
  [4] Custom: type any model ID → fallback to [1] if not found
```

### Q3: QUALITY — Complex work (design, architecture, debugging)
```
  [1] claude-opus-4-8     ← default (best quality)
  [2] claude-sonnet-5     (mid)
  [3] claude-fable-5      (deep reasoning)
  [4] Custom: type any model ID → fallback to [1] if not found
```

## Custom Model [4] — How It Works

User types any model ID. System uses it directly. Fallback built in:

```
User: "use deepseek-chat for ZEN"
System: ✅ Saved. Will use deepseek-chat for simple tasks.
        If deepseek-chat isn't available at runtime,
        I'll fall back to default claude-haiku-4-5.

Later, during a session:
"fix typo in auth.js" → Try deepseek-chat
  → Success? ✅ Used deepseek-chat
  → Not found? ⚠️ "deepseek-chat not available. Using claude-haiku-4-5 instead."
```

**No complex validation. Just try it, fall back if it fails.**

## Quick Answers

| User says | Action |
|-----------|--------|
| "accept defaults" | Skip all questions, use defaults for everything |
| "1" / "2" / "3" | Select that option |
| "4 deepseek-chat" | Custom model = deepseek-chat |
| "use gemini" | Custom = gemini/gemini-flash |
| "use claude" | Custom = claude-sonnet-5 |

## Save & Confirm

```
✅ Saved to .fusion/model-config.json

  ZEN:      deepseek-chat (custom) — fallback: claude-haiku-4-5
  BALANCED: claude-sonnet-5 (default)
  QUALITY:  claude-opus-4-8 (default)

  Auto-switching: ON by default
  Manual override: @zen, @quality, @balanced
  Change anytime: /fusion-setup
```
