#!/usr/bin/env node
/**
 * Fusion Optimizer — Model Router Stats Hook
 * Logs subagent dispatches to .fusion/model-routing.jsonl
 * Tracks: agent name, model, token usage, cost savings
 */
const fs = require('fs');
const path = require('path');

const { parseStdinEvent } = require(path.join(__dirname, 'stdin-helper.js'));
const event = parseStdinEvent();
if (!event) process.exit(0);

const fusionDir = path.join(process.cwd(), '.fusion');
if (!fs.existsSync(fusionDir)) {
  try { fs.mkdirSync(fusionDir, { recursive: true }); } catch { process.exit(0); }
}

const logFile = path.join(fusionDir, 'model-routing.jsonl');

// Detect if this is a Task (subagent dispatch) tool call
const toolName = event.tool_name || event.tool || '';
const toolInput = event.tool_input || event.input || {};

if (toolName === 'Task' || toolName === 'Agent') {
  const agentName = toolInput.subagent_type || toolInput.agent || toolInput.subagent_name || 'unknown';
  const taskDesc = (toolInput.description || toolInput.prompt || '').substring(0, 100);
  
  // Read session state for current mode
  const sessionFile = path.join(fusionDir, 'session.json');
  let mode = 'UNKNOWN';
  if (fs.existsSync(sessionFile)) {
    try { mode = JSON.parse(fs.readFileSync(sessionFile, 'utf-8')).mode || 'UNKNOWN'; } catch {}
  }
  
  // Model estimation based on agent name
  const modelMap = {
    'fusion-zen-agent': 'claude-haiku-4-5',
    'fusion-balanced-agent': 'claude-sonnet-5',
    'fusion-quality-agent': 'claude-opus-4-8',
    'Explore': 'claude-haiku-4-5',
    'general-purpose': 'claude-sonnet-5',
  };
  const estimatedModel = modelMap[agentName] || 'unknown';
  
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    agent: agentName,
    model: estimatedModel,
    mode: mode,
    description: taskDesc,
  });
  
  try {
    fs.appendFileSync(logFile, entry + '\n');
  } catch { /* silent */ }
}

process.exit(0);
