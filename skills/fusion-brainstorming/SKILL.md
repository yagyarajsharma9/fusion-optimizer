---
name: fusion-brainstorming
description: Lightweight design refinement. Activate for QUALITY mode features. Asks clarifying questions, presents design in sections, saves design doc. Caveman-friendly: keeps questions short, design sections terse.
---

# Fusion Brainstorming

Activate when: user says "design", "architecture", "plan", "how should I", or QUALITY mode auto-detects complex work.

## Process

### 1. Understand the Goal (1-2 questions max)
Ask the most important clarifying question. Don't ask 10 questions.

Example: "Goal: add auth. Question: session-based or JWT?"

### 2. Explore Alternatives (brief)
List 2-3 approaches. One sentence each. Pick the best and explain why in one sentence.

### 3. Present Design (short sections)
Present the design in 3-5 sections. Each section:
- What we're building (1 line)
- Key decisions (2-3 bullets)
- Tradeoffs (1 line)

Save to `.fusion/design.md`.

### 4. Validate
"Design saved. Proceed to plan?"

## Rules
- No walls of text. Design doc should be <500 words.
- If user says "just do it", skip to implementation.
- If this is a simple feature, skip brainstorming entirely — go BALANCED mode instead.
