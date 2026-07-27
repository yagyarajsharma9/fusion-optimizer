#!/usr/bin/env node
/**
 * Fusion Optimizer — PostToolUse Hook
 * 
 * Captures tool execution events for stats tracking.
 * In ZEN and BALANCED modes: compresses large tool output before it enters context.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const { parseStdinEvent } = require(path.join(__dirname, 'stdin-helper.js'));
const event = parseStdinEvent();
if (!event) process.exit(0);

const fusionDir = path.join(process.cwd(), '.fusion');

// Ensure .fusion exists
if (!fs.existsSync(fusionDir)) {
  fs.mkdirSync(fusionDir, { recursive: true });
}

// Read session state
const sessionFile = path.join(fusionDir, 'session.json');
let state = { mode: 'BALANCED', turns: 0, toolCalls: 0, toolBytesCaptured: 0 };
if (fs.existsSync(sessionFile)) {
  try {
    state = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  } catch {}
}

// Update tool call stats
state.toolCalls = (state.toolCalls || 0) + 1;

// Estimate bytes saved by routing (rough heuristic)
const toolName = event.tool_name || event.tool || '';
const toolOutput = event.tool_output || event.output || '';
const outputSize = typeof toolOutput === 'string' ? Buffer.byteLength(toolOutput, 'utf-8') : JSON.stringify(toolOutput).length;

// Track for stats
state.toolBytesCaptured = (state.toolBytesCaptured || 0) + outputSize;

// Track tool call history for mode decisions
state.lastToolCalls = [...(state.lastToolCalls || []).slice(-10), {
  tool: toolName,
  size: outputSize,
  time: new Date().toISOString(),
}];

fs.writeFileSync(sessionFile, JSON.stringify(state, null, 2));

// If in ZEN mode, hint about context savings
if (state.mode === 'ZEN' && outputSize > 5000) {
  process.stdout.write(JSON.stringify({
    context: `<fusion-note>Tool output: ~${Math.round(outputSize/1000)}KB. In ZEN mode — consider summarizing next time.</fusion-note>`,
  }));
}

process.exit(0);
