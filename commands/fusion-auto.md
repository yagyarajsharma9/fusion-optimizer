# /fusion-auto — Auto Mode

Let Fusion Optimizer automatically select the best mode based on task complexity.

## Usage

/fusion-auto

## How It Works
Fusion Optimizer analyzes each prompt and selects:
- **ZEN** for simple questions, fixes, data queries
- **BALANCED** for feature work, refactoring, medium bugs
- **QUALITY** for architecture, new projects, migrations

Auto-escalation: 3 consecutive failures → QUALITY mode
Budget protection: if >80% token budget used → force ZEN
