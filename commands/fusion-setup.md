# /fusion-setup — Configure Models

Pick which models to use for each task tier. Saved permanently.

## Usage

/fusion-setup

## How It Works

```
AUTO (always on)              MANUAL (override)
────────────────              ──────────────────
Simple task → ZEN → Haiku     @zen → force ZEN this prompt
Feature    → BAL → Sonnet     @quality → force QUALITY
Complex    → QUAL → Opus      @balanced → force BALANCED
```

**Auto switching is default.** Manual override works alongside it — no conflict.

## Custom Model [4]

Type any model ID. Example: "deepseek-chat", "gemini-flash", "gpt-4o".

If the model doesn't exist at runtime → auto-falls back to default. You get notified.

```
User: [4] deepseek-chat for ZEN
Fusion: ✅ Saved. Will try deepseek-chat. If unavailable, falls back to Haiku.

Later session:
"fix typo" → tries deepseek-chat → not found → uses Haiku instead
Fusion: ⚠️ "deepseek-chat not available. Used claude-haiku-4-5. /fusion-setup to change."
```

No complex validation. System tries, catches failure, falls back.
