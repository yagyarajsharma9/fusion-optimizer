---
name: fusion-stats
description: Display Fusion Optimizer session statistics — mode distribution, token savings, cost estimates. Activate with /fusion-stats command.
---

# Fusion Stats

Activate when: user runs `/fusion-stats` or asks "how much did I save".

## Display Format

```
╔══════════════════════════════════════════════╗
║           FUSION OPTIMIZER STATS             ║
╠══════════════════════════════════════════════╣
║ Mode distribution:                           ║
║   ZEN      ████████████░░░░  12 turns (60%)  ║
║   BALANCED ██████░░░░░░░░░░   6 turns (30%)  ║
║   QUALITY  ██░░░░░░░░░░░░░░   2 turns (10%)  ║
╠══════════════════════════════════════════════╣
║ Token estimate:                              ║
║   Input:   ~45,000 tokens                    ║
║   Output:  ~12,000 tokens (with caveman)     ║
║   Saved:   ~18,000 output tokens (60%)       ║
╠══════════════════════════════════════════════╣
║ Cost estimate (Opus rates):                  ║
║   Without Fusion:  ~$1.05                    ║
║   With Fusion:     ~$0.72                    ║
║   Saved:           ~$0.33 (31%)              ║
╠══════════════════════════════════════════════╣
║ Current mode: BALANCED                       ║
║ Skills loaded: fusion-tdd, fusion-memory     ║
╚══════════════════════════════════════════════╝
```

## Calculation Notes
- Output savings estimated at: ZEN=65%, BALANCED=40%, QUALITY=25%
- Context savings estimated at: ZEN=60%, BALANCED=30%, QUALITY=15%
- Based on caveman benchmarks + context-mode compression rates
- These are ESTIMATES. Real savings vary by task type.
- Session token counts read from Claude Code session logs.
