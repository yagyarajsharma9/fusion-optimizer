# /fusion-setup — Configure Model Tiers

Interactive setup wizard for Fusion Optimizer model routing. Run once after install — changes persist permanently.

## Usage

/fusion-setup

## What It Does

1. Shows current model configuration
2. Asks: which model for ZEN tasks (cheap, like Haiku)?
3. Asks: which model for BALANCED tasks (mid, like Sonnet)?
4. Asks: which model for QUALITY tasks (best, like Opus)?
5. Asks: which model for main conversation?
6. Saves to `.fusion/model-config.json`

## Example

```
You: /fusion-setup

Fusion: Current config:
  ZEN:     claude-haiku-4-5 (Haiku)
  BALANCED: claude-sonnet-5 (Sonnet)
  QUALITY:  claude-opus-4-8 (Opus)
  MAIN:     claude-opus-4-8 (Opus)

Fusion: ZEN tasks (fixes, searches) → which model?
  [1] claude-haiku-4-5 (Haiku) ← default
  [2] claude-sonnet-5 (Sonnet)
  [3] claude-opus-4-8 (Opus)
  [4] Custom: type model ID

You: 1

Fusion: BALANCED tasks (features, refactor) → which model?
  [1] claude-sonnet-5 (Sonnet) ← default
  ... (same format)

You: 2  (or "accept defaults" to skip remaining)

Fusion: ✅ Configuration saved!
  ZEN:     claude-haiku-4-5
  BALANCED: claude-sonnet-5
  QUALITY:  claude-opus-4-8
  MAIN:     claude-opus-4-8
  Models locked. Run /fusion-setup anytime to change.
```

## Behind the Scenes

Configuration saved as JSON in `.fusion/model-config.json`. Not committed to git (gitignored). Each project can have its own config, or share the global default.
