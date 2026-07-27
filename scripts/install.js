#!/usr/bin/env node
/**
 * Fusion Optimizer — Universal Installer
 * Detects which coding agents are installed on your machine and installs for each.
 * 
 * Supports: Claude Code, Codex, Cursor, Gemini CLI, Windsurf, Cline, Copilot,
 *           and any AGENTS.md-compatible tool.
 * 
 * Usage:
 *   node scripts/install.js
 *   node scripts/install.js --agent claude-code
 *   node scripts/install.js --agent cursor,codex
 *   node scripts/install.js --dry-run
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();

const AGENTS = {
  'claude-code': {
    name: 'Claude Code',
    detect: () => {
      try { execSync('claude --version', { stdio: 'pipe' }); return true; } catch { return false; }
    },
    install: () => {
      // Register marketplace locally
      execSync(`claude plugin marketplace add ${PLUGIN_ROOT}`, { stdio: 'pipe' });
      execSync('claude plugin install fusion-optimizer@fusion-optimizer', { stdio: 'pipe' });
    },
  },
  'codex': {
    name: 'Codex CLI',
    detect: () => {
      try { execSync('codex --version', { stdio: 'pipe' }); return true; } catch { return false; }
    },
    install: () => {
      // Codex reads from .codex-plugin/
      console.log('  Codex auto-discovers plugins from project root. No install needed.');
    },
  },
  'cursor': {
    name: 'Cursor',
    detect: () => {
      const cursorPath = process.platform === 'darwin' 
        ? '/Applications/Cursor.app' 
        : process.platform === 'win32'
        ? path.join(HOME, 'AppData', 'Local', 'Programs', 'Cursor')
        : null;
      return cursorPath && fs.existsSync(cursorPath);
    },
    install: () => {
      // Cursor picks up .cursor-plugin/ and AGENTS.md from project root
      console.log('  Cursor auto-discovers plugins from project root. No install needed.');
    },
  },
  'gemini': {
    name: 'Gemini CLI',
    detect: () => {
      try { execSync('gemini --version', { stdio: 'pipe' }); return true; } catch { return false; }
    },
    install: () => {
      execSync(`gemini extensions install ${PLUGIN_ROOT}`, { stdio: 'pipe' });
    },
  },
  'windsurf': {
    name: 'Windsurf',
    detect: () => fs.existsSync(path.join(HOME, '.codeium', 'windsurf')),
    install: () => {
      console.log('  Windsurf reads AGENTS.md and .windsurfrules. Copy AGENTS.md to project root.');
    },
  },
  'cline': {
    name: 'Cline (VS Code)',
    detect: () => fs.existsSync(path.join(HOME, '.vscode', 'extensions')),
    install: () => {
      console.log('  Cline reads AGENTS.md from project root. Ensure AGENTS.md is present.');
    },
  },
  'copilot': {
    name: 'GitHub Copilot',
    detect: () => {
      try { execSync('gh copilot --version', { stdio: 'pipe' }); return true; } catch { return false; }
    },
    install: () => {
      const destDir = path.join(process.cwd(), '.github');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const src = path.join(PLUGIN_ROOT, 'AGENTS.md');
      const dest = path.join(destDir, 'copilot-instructions.md');
      fs.copyFileSync(src, dest);
      console.log(`  Copied AGENTS.md → ${dest}`);
    },
  },
};

function detectAll() {
  const found = [];
  for (const [id, agent] of Object.entries(AGENTS)) {
    try {
      if (agent.detect()) found.push(id);
    } catch { /* skip */ }
  }
  return found;
}

function installAll(dryRun) {
  console.log('\n🔍 Detecting installed coding agents...\n');
  
  const found = detectAll();
  
  if (found.length === 0) {
    console.log('⚠ No coding agents detected. Install one first (claude, codex, cursor, gemini, etc.)');
    console.log('\nTo manually use Fusion Optimizer:');
    console.log('  1. Copy AGENTS.md to your project root');
    console.log('  2. Configure your agent to read AGENTS.md on startup');
    return;
  }
  
  console.log(`Found ${found.length} agents: ${found.map(f => AGENTS[f].name).join(', ')}\n`);
  
  for (const id of found) {
    const agent = AGENTS[id];
    console.log(`📦 ${agent.name}...`);
    if (dryRun) {
      console.log('   [DRY RUN] Would install');
    } else {
      try {
        agent.install();
        console.log(`   ✅ Installed`);
      } catch (e) {
        console.log(`   ⚠ Failed: ${e.message}`);
      }
    }
  }
  
  // Always copy AGENTS.md to project root (universal entry point)
  const agentsMdSrc = path.join(PLUGIN_ROOT, 'AGENTS.md');
  const agentsMdDest = path.join(process.cwd(), 'AGENTS.md');
  
  if (!fs.existsSync(agentsMdDest)) {
    if (!dryRun) fs.copyFileSync(agentsMdSrc, agentsMdDest);
    console.log('\n📄 Copied AGENTS.md to project root (universal cross-tool entry)');
  }
  
  console.log('\n✅ Done! Start a new session and say "hello" to test.');
  console.log('   Try /fusion or /compress to get started.');
}

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const agentFilter = args.find(a => a.startsWith('--agent='));
const specificAgents = agentFilter ? agentFilter.replace('--agent=', '').split(',') : null;

if (specificAgents) {
  console.log(`\n🔍 Installing for: ${specificAgents.map(a => AGENTS[a]?.name || a).join(', ')}\n`);
  for (const id of specificAgents) {
    const agent = AGENTS[id.trim()];
    if (!agent) {
      console.log(`⚠ Unknown agent: ${id}. Available: ${Object.keys(AGENTS).join(', ')}`);
      continue;
    }
    if (!agent.detect()) {
      console.log(`⚠ ${agent.name} not detected on this machine. Try installing it first.`);
      continue;
    }
    console.log(`📦 ${agent.name}...`);
    if (dryRun) {
      console.log('   [DRY RUN] Would install');
    } else {
      try {
        agent.install();
        console.log(`   ✅ Installed`);
      } catch (e) {
        console.log(`   ⚠ Failed: ${e.message}`);
      }
    }
  }
} else {
  installAll(dryRun);
}
