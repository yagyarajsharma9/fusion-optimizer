#!/usr/bin/env node
/**
 * Fusion Optimizer - SessionStart Hook
 * Injects fusion-core skill and initializes session state.
 */
const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || __dirname + '/..';

// Initialize fusion state directory
const fusionDir = path.join(process.cwd(), '.fusion');
if (!fs.existsSync(fusionDir)) {
  fs.mkdirSync(fusionDir, { recursive: true });
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

// Output for context injection
const coreSkillPath = path.join(pluginRoot, 'skills', 'fusion-core', 'SKILL.md');
if (fs.existsSync(coreSkillPath)) {
  const skillContent = fs.readFileSync(coreSkillPath, 'utf-8');
  // Truncate to avoid massive context injection — just the essentials
  const essential = skillContent.split('\n').slice(0, 80).join('\n');
  process.stdout.write(JSON.stringify({
    context: `<fusion-state>\nInit mode: ${initialMode}\nProject: ${process.cwd().split('/').pop() || process.cwd().split('\\\\').pop()}\nSkills dir: ${path.join(pluginRoot, 'skills')}\n</fusion-state>`,
    mode: initialMode,
  }));
} else {
  process.stdout.write(JSON.stringify({
    context: `<fusion-state>Init mode: ${initialMode}</fusion-state>`,
    mode: initialMode,
  }));
}

process.exit(0);
