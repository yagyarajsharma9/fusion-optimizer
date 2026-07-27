#!/usr/bin/env node
/**
 * Fusion Optimizer - UserPromptSubmit Hook
 * Re-evaluates mode per turn. Injects mode-aware context.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const { parseStdinEvent } = require(path.join(__dirname, 'stdin-helper.js'));
const event = parseStdinEvent();
if (!event) process.exit(0);

const userPrompt = event.prompt || '';
const fusionDir = path.join(process.cwd(), '.fusion');
const sessionFile = path.join(fusionDir, 'session.json');

let state = { mode: 'BALANCED', turns: 0, failures: 0, modeHistory: [] };
if (fs.existsSync(sessionFile)) {
  try {
    state = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  } catch {}
}

// Increment turn counter
state.turns = (state.turns || 0) + 1;

// Mode detection from prompt
function detectModeRequest(prompt) {
  const lower = prompt.toLowerCase();
  if (/@zen|zen mode|cost mode|budget mode/.test(lower)) return 'ZEN';
  if (/@quality|quality mode|full mode|methodology mode/.test(lower)) return 'QUALITY';
  if (/@balanced|balanced mode|default mode/.test(lower)) return 'BALANCED';
  return null;
}

function detectTaskComplexity(prompt) {
  const lower = prompt.toLowerCase();
  
  // Trivial
  const trivialPatterns = [
    /^fix\s+(typo|spelling|comment|format)/, /^rename\s+\w+(\s+to\s+\w+)?/,
    /^delete\s+(line|file|comment)/, /^what\s+(is|does|are)/,
    /^where\s+(is|are)/, /^find\s+(all|the|where)/,
    /^show\s+(me|the)/, /^list\s+(all|the)/,
    /^explain\s+\w+/, /^how\s+(do|does|to)\s+(I\s+)?(run|check|see|find|get)/,
    /^search\s+(for|the)/, /^look\s+(up|for)/,
    /^add\s+(comment|doc|type)/, /^update\s+(comment|doc|readme)/,
    /^format\s+(code|file)/, /^lint\s+(fix|check)/,
  ];
  
  if (trivialPatterns.some(p => p.test(lower))) return 'ZEN';
  
  // Complex
  const complexPatterns = [
    /^(design|architect(ure)?)\s/, /^migrate\s+(from|to)/,
    /^(new|create)\s+(project|app|system|service|microservice)/,
    /^(rewrite|refactor)\s+(entire|whole|major)/,
    /^(plan|propose|suggest)\s+(an?\s+)?(architecture|system|design)/,
    /^(implement|build)\s+(an?\s+)?(auth|payment|search|notification|pipeline)/,
    /multi[- ]?(tenant|service|module)/,
  ];
  
  if (complexPatterns.some(p => p.test(lower))) return 'QUALITY';
  
  // Default BALANCED
  return 'BALANCED';
}

// Determine new mode
const requestedMode = detectModeRequest(userPrompt);
const detectedComplexity = detectTaskComplexity(userPrompt);

let newMode = state.mode; // Keep current unless overridden

if (requestedMode) {
  newMode = requestedMode;
} else if (state.failures >= 3) {
  newMode = 'QUALITY'; // Escalate if stuck
  state.failures = 0; // Reset after escalation
} else if (detectedComplexity === 'QUALITY' && state.mode !== 'QUALITY' && state.turns > 3) {
  newMode = 'QUALITY'; // Complex task, escalate after a few turns
}

// Track mode changes
if (newMode !== state.mode) {
  state.modeHistory = [...(state.modeHistory || []), newMode];
}

state.mode = newMode;

// Save state
fs.writeFileSync(sessionFile, JSON.stringify(state, null, 2));

// Output for context injection
const modeContexts = {
  ZEN: '<fusion-mode>ZEN — caveman-ultra output. No methodology. Use context-mode for large output.</fusion-mode>',
  BALANCED: '<fusion-mode>BALANCED — caveman-lite output. TDD if coding, debug if bug. Context-mode for tool output.</fusion-mode>',
  QUALITY: '<fusion-mode>QUALITY — caveman-lite output. FULL methodology: brainstorm → plan → TDD → review. Context-mode for tools.</fusion-mode>',
};

const modeSwitchNote = newMode !== (state.modeHistory[state.modeHistory.length - 2] || '')
  ? `Mode: ${newMode} (was: ${state.modeHistory[state.modeHistory.length - 2] || 'N/A'})`
  : `Mode: ${newMode}`;

process.stdout.write(JSON.stringify({
  context: modeContexts[newMode],
  mode: newMode,
  note: modeSwitchNote,
}));

process.exit(0);
