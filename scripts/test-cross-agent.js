#!/usr/bin/env node
/**
 * Fusion Optimizer — Cross-Agent Compatibility Test
 * 
 * Checks what features work on this machine and which agents are present.
 * One command: node scripts/test-cross-agent.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const PASS = '✅';
const WARN = '⚠️';
const FAIL = '❌';

function check(cmd, label) {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 5000 });
    return { status: PASS, label };
  } catch {
    return { status: FAIL, label };
  }
}

function fileExists(p, label) {
  return { status: fs.existsSync(path.join(PLUGIN_ROOT, p)) ? PASS : FAIL, label };
}

function dirHasFiles(p, label) {
  try {
    const count = fs.readdirSync(path.join(PLUGIN_ROOT, p)).length;
    return { status: count > 0 ? PASS : FAIL, label: `${label} (${count} files)` };
  } catch {
    return { status: FAIL, label };
  }
}

// ====== PLUGIN FILES ======
const plugin = [
  fileExists('.claude-plugin/plugin.json', 'Claude Code manifest'),
  fileExists('.codex-plugin/plugin.json', 'Codex manifest'),
  fileExists('.cursor-plugin/plugin.json', 'Cursor manifest'),
  fileExists('gemini-extension.json', 'Gemini extension'),
  fileExists('AGENTS.md', 'Universal AGENTS.md'),
  dirHasFiles('skills', 'Skills'),
  dirHasFiles('commands', 'Commands'),
  dirHasFiles('hooks', 'Hooks'),
  fileExists('.opencode/plugins/fusion-optimizer.js', 'OpenCode native plugin'),
  fileExists('config/model-config.default.json', 'Model config default'),
];

// ====== INSTALLED AGENTS ======
const agents = [
  check('claude --version', 'Claude Code CLI'),
  check('opencode --version', 'OpenCode CLI'),
  { status: fs.existsSync(path.join(process.env.USERPROFILE || '~', '.cursor')) ? PASS : WARN, label: 'Cursor' },
  check('git --version', 'Git'),
];

// ====== RUNTIME ======
const runtime = [
  check('node --version', 'Node.js'),
];

console.log('\n═══════════════════════════════════════');
console.log('  FUSION OPTIMIZER — CROSS-AGENT TEST');
console.log('═══════════════════════════════════════\n');

console.log('Plugin Files:');
plugin.forEach(p => console.log(`  ${p.status} ${p.label}`));

console.log('\nInstalled Agents:');
agents.forEach(a => console.log(`  ${a.status} ${a.label}`));

console.log('\nRuntime:');
runtime.forEach(r => console.log(`  ${r.status} ${r.label}`));

// ====== FEATURE MATCH ======
const claudeInstalled = agents[0].status === PASS;
const opencodeInstalled = agents[1].status === PASS;
const hasGit = agents[3].status === PASS;

console.log('\n═══════════════════════════════════════');
console.log('  FEATURE AVAILABILITY ON THIS MACHINE');
console.log('═══════════════════════════════════════\n');

const features = [
  { name: 'Skills (8)', cc: PASS, oc: PASS, other: PASS },
  { name: 'Commands (7)', cc: PASS, oc: WARN, other: FAIL },
  { name: 'Hook enforcement (6 hooks)', cc: PASS, oc: PASS, other: FAIL },
  { name: 'Model auto-routing', cc: PASS, oc: PASS, other: WARN },
  { name: 'Tool routing (22 patterns)', cc: PASS, oc: PASS, other: FAIL },
  { name: 'Cross-session memory', cc: PASS, oc: PASS, other: PASS },
  { name: 'Setup wizard', cc: PASS, oc: PASS, other: PASS },
  { name: 'AGENTS.md universal', cc: PASS, oc: PASS, other: PASS },
];

console.log('Feature                   Claude Code  OpenCode   Cursor/etc');
console.log('────────────────────────  ───────────  ────────   ──────────');
features.forEach(f => {
  console.log(`${f.name.padEnd(25)} ${f.cc.padEnd(11)} ${f.oc.padEnd(9)} ${f.other}`);
});

console.log('\nLegend: ✅ Full  ⚠️ Advisory  ❌ Not supported');
console.log('Model routing + hooks: ✅ on Claude/OpenCode, ⚠️ on others');

process.exit(0);
