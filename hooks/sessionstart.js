#!/usr/bin/env node
/**
 * Fusion Optimizer - SessionStart Hook
 * Injects fusion-core skill and initializes session state.
 */
const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

// Initialize fusion state directory
const fusionDir = path.join(process.cwd(), '.fusion');
try {
  if (!fs.existsSync(fusionDir)) {
    fs.mkdirSync(fusionDir, { recursive: true });
  }
} catch {
  // Silently continue — hooks are optional, skills/commands work without them
  process.exit(0);
}

// Initialize memory file if not exists
const memoryFile = path.join(fusionDir, 'memory.md');
if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, `# Project Memory\n\n## Session started: ${new Date().toISOString()}\n\n## Architecture Decisions\n\n## Gotchas & Bugs\n\n## Active Context\n\n`);
}

// Initialize design file
const designFile = path.join(fusionDir, 'design.md');
if (!fs.existsSync(designFile)) {
  fs.writeFileSync(designFile, '# Design Documents\n\n');
}

// Detect project complexity for initial mode
function detectProjectComplexity() {
  const cwd = process.cwd();
  let score = 0;
  
  // File count
  try {
    const files = fs.readdirSync(cwd, { withFileTypes: true, recursive: true }).filter(f => f.isFile());
    score += files.length > 100 ? 1 : files.length > 20 ? 0 : -1;
  } catch { score += 0; }
  
  // Has package.json?
  if (fs.existsSync(path.join(cwd, 'package.json'))) score += 1;
  
  // Has tests directory?
  if (fs.existsSync(path.join(cwd, '__tests__')) || fs.existsSync(path.join(cwd, 'tests')) || fs.existsSync(path.join(cwd, 'test'))) score += 1;

  // Has multiple source dirs?
  const srcDirs = ['src', 'lib', 'app', 'components', 'pages'].filter(d => fs.existsSync(path.join(cwd, d)));
  score += Math.min(srcDirs.length, 2);
  
  return score <= 0 ? 'ZEN' : score <= 2 ? 'BALANCED' : 'QUALITY';
}

const initialMode = detectProjectComplexity();

// Write session state
const sessionState = {
  mode: initialMode,
  turns: 0,
  modeHistory: [initialMode],
  failures: 0,
  startTime: new Date().toISOString(),
};

fs.writeFileSync(path.join(fusionDir, 'session.json'), JSON.stringify(sessionState, null, 2));

// === Model Configuration Check ===
const modelConfigPath = path.join(fusionDir, 'model-config.json');
const defaultConfigPath = path.join(pluginRoot, 'config', 'model-config.default.json');
let modelConfig = null;
let setupNeeded = false;

if (fs.existsSync(modelConfigPath)) {
  try {
    modelConfig = JSON.parse(fs.readFileSync(modelConfigPath, 'utf-8'));
    setupNeeded = !modelConfig.setup_complete;
  } catch { setupNeeded = true; }
} else {
  // First run — copy default config
  try {
    if (fs.existsSync(defaultConfigPath)) {
      fs.copyFileSync(defaultConfigPath, modelConfigPath);
    }
  } catch {}
  setupNeeded = true;
}

// Build context injection
let contextBlock = `<fusion-state>
Init mode: ${initialMode}
Project: ${process.cwd().split('/').pop() || process.cwd().split('\\\\').pop()}
</fusion-state>`;

if (setupNeeded) {
  contextBlock += `

<fusion-setup>
╔══════════════════════════════════════════════════╗
║  🚀 FUSION OPTIMIZER — FIRST-TIME SETUP          ║
╠══════════════════════════════════════════════════╣
║  Default models selected:                        ║
║    ZEN     → Haiku  (claude-haiku-4-5)           ║
║    BALANCED → Sonnet (claude-sonnet-5)            ║
║    QUALITY → Opus   (claude-opus-4-8)            ║
╠══════════════════════════════════════════════════╣
║  To accept defaults: type "accept models"         ║
║  To change: type "/fusion-setup"                  ║
║  This setup appears ONCE. After today,            ║
║  Fusion remembers your choices forever.           ║
╚══════════════════════════════════════════════════╝

ASK THE USER NOW: "Welcome to Fusion Optimizer! Which
models would you like me to use? Defaults above — accept
or customize?"
</fusion-setup>`;
}

process.stdout.write(JSON.stringify({
  context: contextBlock,
  mode: initialMode,
}));

process.exit(0);
