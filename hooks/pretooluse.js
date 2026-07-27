#!/usr/bin/env node
/**
 * Fusion Optimizer — PreToolUse Hook (Expanded)
 * 
 * Smart tool routing with 15+ patterns across 6 categories:
 * - Git commands (log, diff, blame, show)
 * - Package managers (npm, pip, cargo, go)
 * - Test runners (jest, pytest, go test, cargo test)
 * - Build tools (make, cmake, docker, gradle, maven)
 * - HTTP requests (curl, wget, fetch)
 * - File operations (find, ls, cat, grep)
 * 
 * Only active in ZEN and BALANCED modes. QUALITY = passthrough.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const { parseStdinEvent } = require(path.join(__dirname, 'stdin-helper.js'));
const event = parseStdinEvent();
if (!event) process.exit(0);

const toolName = event.tool_name || event.tool || '';
const toolInput = event.tool_input || event.input || {};
const command = toolInput.command || '';

// Read current mode
const fusionDir = path.join(process.cwd(), '.fusion');
const sessionFile = path.join(fusionDir, 'session.json');
let mode = 'BALANCED';
if (fs.existsSync(sessionFile)) {
  try {
    mode = JSON.parse(fs.readFileSync(sessionFile, 'utf-8')).mode || 'BALANCED';
  } catch {}
}

// QUALITY mode → passthrough everything
if (mode === 'QUALITY') {
  process.exit(0);
}

// === ROUTING RULES ===

const rules = [
  // ============ GIT COMMANDS ============
  {
    id: 'git-log-unbounded',
    match: () => toolName === 'Bash' && /\bgit\s+log\b/.test(command) && !/\b(--oneline|-n\s+\d+|--stat|--name-only|--format=|\.\.)/.test(command),
    transform: () => command.replace(/(git\s+log)/, '$1 --oneline -n 30'),
    reason: 'Added --oneline -n 30',
  },
  {
    id: 'git-diff-unbounded',
    match: () => toolName === 'Bash' && /\bgit\s+diff\b/.test(command) && !/\b(--stat|--name-only|--name-status|--word-diff|\.{2,3}|\S+\.\.\S+|HEAD~\d+)/.test(command),
    transform: () => command.replace(/(git\s+diff)/, '$1 --stat'),
    reason: 'Added --stat',
  },
  {
    id: 'git-blame-unbounded',
    match: () => toolName === 'Bash' && /\bgit\s+blame\b/.test(command) && !/\b-L\b/.test(command),
    transform: () => command + ' | head -50',
    reason: 'Added | head -50',
  },
  {
    id: 'git-show-large',
    match: () => toolName === 'Bash' && /\bgit\s+show\b/.test(command) && !/\b(--stat|--name-only|-s)\b/.test(command),
    transform: () => command + ' --stat',
    reason: 'Added --stat',
  },

  // ============ PACKAGE MANAGERS ============
  {
    id: 'npm-install-verbose',
    match: () => toolName === 'Bash' && /\bnpm\s+(install|ci|update)\b/.test(command) && !/\b(--silent|--quiet|--loglevel|-q|2>&1)\b/.test(command),
    transform: () => command + ' --silent',
    reason: 'Added --silent',
  },
  {
    id: 'yarn-install-verbose',
    match: () => toolName === 'Bash' && /\byarn\s+(install|add)\b/.test(command) && !/\b(--silent|--quiet|2>&1)\b/.test(command),
    transform: () => command + ' --silent',
    reason: 'Added --silent',
  },
  {
    id: 'pnpm-install-verbose',
    match: () => toolName === 'Bash' && /\bpnpm\s+(install|add)\b/.test(command) && !/\b(--silent|--quiet|--reporter)\b/.test(command),
    transform: () => command + ' --silent',
    reason: 'Added --silent',
  },
  {
    id: 'pip-install-verbose',
    match: () => toolName === 'Bash' && /\bpip\s+install\b/.test(command) && !/\b(-q|--quiet|2>&1)\b/.test(command),
    transform: () => command.replace('pip install', 'pip install -q'),
    reason: 'Added -q',
  },
  {
    id: 'cargo-verbose',
    match: () => toolName === 'Bash' && /\bcargo\s+(build|install|update)\b/.test(command) && !/\b(--quiet|-q|2>&1)\b/.test(command),
    transform: () => command + ' -q 2>&1 | tail -20',
    reason: 'Added -q + tail',
  },
  {
    id: 'go-get-verbose',
    match: () => toolName === 'Bash' && /\bgo\s+(get|install)\b/.test(command) && !/\b(2>&1|\|)\b/.test(command),
    transform: () => command + ' 2>&1 | tail -20',
    reason: 'Added redirection + tail',
  },

  // ============ TEST RUNNERS ============
  {
    id: 'jest-vitest-verbose',
    match: () => toolName === 'Bash' && /\b(npx\s+)?(jest|vitest)\b/.test(command) && !/\b(--silent|2>&1|\||--reporter)\b/.test(command),
    transform: () => command + ' 2>&1 | tail -30',
    reason: 'Added tail -30',
  },
  {
    id: 'pytest-verbose',
    match: () => toolName === 'Bash' && /\bpytest\b/.test(command) && !/\b(-q|--quiet|--tb=short|2>&1|\|)\b/.test(command),
    transform: () => command + ' -q --tb=short 2>&1 | tail -30',
    reason: 'Added -q --tb=short + tail',
  },
  {
    id: 'go-test-verbose',
    match: () => toolName === 'Bash' && /\bgo\s+test\b/.test(command) && !/\b(-v|2>&1|\|)\b/.test(command),
    transform: () => command + ' 2>&1 | tail -30',
    reason: 'Added tail -30',
  },
  {
    id: 'cargo-test-verbose',
    match: () => toolName === 'Bash' && /\bcargo\s+test\b/.test(command) && !/\b(-q|--quiet|2>&1|\|)\b/.test(command),
    transform: () => command + ' -q 2>&1 | tail -30',
    reason: 'Added -q + tail',
  },

  // ============ BUILD TOOLS ============
  {
    id: 'make-verbose',
    match: () => toolName === 'Bash' && /\bmake\b/.test(command) && !/\b(-s|--silent|2>&1|\|)\b/.test(command) && !/\btest\b/.test(command),
    transform: () => command + ' -s 2>&1 | tail -20',
    reason: 'Added -s + tail',
  },
  {
    id: 'docker-build-verbose',
    match: () => toolName === 'Bash' && /\bdocker\s+build\b/.test(command) && !/\b(--quiet|-q|2>&1|\|)\b/.test(command),
    transform: () => command.replace('docker build', 'docker build -q'),
    reason: 'Added -q',
  },

  // ============ HTTP REQUESTS ============
  {
    id: 'curl-verbose',
    match: () => toolName === 'Bash' && /\bcurl\b/.test(command) && !/\b(-s|--silent|-o|--output|>)\b/.test(command),
    action: 'warn',
    reason: 'Prefer web fetch tool (WebFetch) over curl — keeps response out of context.',
  },
  {
    id: 'wget-verbose',
    match: () => toolName === 'Bash' && /\bwget\b/.test(command) && !/\b(-q|--quiet|-O)\b/.test(command),
    action: 'warn',
    reason: 'Prefer web fetch tool over wget — keeps response out of context.',
  },

  // ============ FILE OPERATIONS ============
  {
    id: 'find-recursive-unbounded',
    match: () => toolName === 'Bash' && /\bfind\b/.test(command) && !/\b(maxdepth|-type|\.head|\.tail|\|)\b/.test(command),
    action: 'warn',
    reason: 'Unbounded find may produce large output. Consider -maxdepth, -type, or pipe to head.',
  },
  {
    id: 'ls-recursive',
    match: () => toolName === 'Bash' && /\bls\s+.*-R/.test(command) && !/\|/.test(command),
    action: 'warn',
    reason: 'Recursive ls may be large. Use Glob tool or find -maxdepth instead.',
  },
  {
    id: 'cat-large-file',
    match: () => toolName === 'Bash' && /\bcat\b/.test(command) && !/\|/.test(command) && !command.includes('.env'),
    action: 'warn',
    reason: 'cat loads entire file into context. Use Read with offset+limit for analysis, or Read for editing.',
  },

  // ============ READ TOOL GUIDANCE ============
  {
    id: 'read-no-limit',
    match: () => toolName === 'Read' && toolInput.file_path && !toolInput.offset && !toolInput.limit,
    action: 'warn',
    reason: 'Reading entire file. For large analysis files (>500 lines), use offset+limit.',
  },
  {
    id: 'grep-no-include',
    match: () => toolName === 'Grep' && toolInput.pattern && !toolInput.include,
    action: 'warn',
    reason: 'Grep without file filter may scan large/binary files. Add include pattern (e.g., "*.ts").',
  },
];

// Execute rules
for (const rule of rules) {
  if (!rule.match()) continue;
  
  if (rule.action === 'warn') {
    process.stdout.write(JSON.stringify({
      decision: 'allow',
      warning: `[Fusion] ${rule.reason}`,
    }));
    process.exit(0);
  }
  
  if (rule.transform) {
    const newCommand = rule.transform();
    if (newCommand !== command) {
      process.stdout.write(JSON.stringify({
        decision: 'modify',
        modifiedInput: { ...toolInput, command: newCommand },
        warning: `[Fusion] ${rule.reason}`,
      }));
      process.exit(0);
    }
  }
}

// Default: allow
process.exit(0);
