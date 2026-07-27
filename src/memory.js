#!/usr/bin/env node
/**
 * Fusion Optimizer - Memory Manager
 * Cross-session persistent memory for project context.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_MEMORY = `# Project Memory

## Architecture Decisions
<!-- Format: [YYYY-MM-DD] Decision: what — Why: reason — Context: file/path -->

## Gotchas & Bugs
<!-- Format: [YYYY-MM-DD] Bug: what — Fix: how — File: path -->

## Active Context
<!-- Current branch, feature, blockers -->
`;

function getMemoryFilePath() {
  return path.join(process.cwd(), '.fusion', 'memory.md');
}

function getArchiveFilePath() {
  return path.join(process.cwd(), '.fusion', 'memory-archive.md');
}

function ensureMemoryFile() {
  const file = getMemoryFilePath();
  if (!fs.existsSync(file)) {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, DEFAULT_MEMORY);
  }
  return file;
}

/**
 * Save a decision to memory.
 */
function saveDecision(decision, reason, context) {
  const file = ensureMemoryFile();
  const date = new Date().toISOString().split('T')[0];
  const entry = `- [${date}] Decision: ${decision} — Why: ${reason} — Context: ${context}\n`;
  
  let content = fs.readFileSync(file, 'utf-8');
  const marker = '## Architecture Decisions\n';
  const idx = content.indexOf(marker);
  
  if (idx !== -1) {
    const before = content.substring(0, idx + marker.length);
    const after = content.substring(idx + marker.length);
    content = before + entry + after;
  } else {
    content += `\n## Architecture Decisions\n${entry}`;
  }
  
  fs.writeFileSync(file, content);
  trimIfNeeded(file);
}

/**
 * Save a gotcha/bug discovery.
 */
function saveGotcha(bug, fix, filePath) {
  const file = ensureMemoryFile();
  const date = new Date().toISOString().split('T')[0];
  const entry = `- [${date}] Bug: ${bug} — Fix: ${fix} — File: ${filePath}\n`;
  
  let content = fs.readFileSync(file, 'utf-8');
  const marker = '## Gotchas & Bugs\n';
  const idx = content.indexOf(marker);
  
  if (idx !== -1) {
    const before = content.substring(0, idx + marker.length);
    const after = content.substring(idx + marker.length);
    content = before + entry + after;
  } else {
    content += `\n## Gotchas & Bugs\n${entry}`;
  }
  
  fs.writeFileSync(file, content);
  trimIfNeeded(file);
}

/**
 * Update active context.
 */
function updateActiveContext(context) {
  const file = ensureMemoryFile();
  let content = fs.readFileSync(file, 'utf-8');
  
  const marker = '## Active Context\n';
  const idx = content.indexOf(marker);
  
  if (idx !== -1) {
    content = content.substring(0, idx + marker.length) + context + '\n';
  } else {
    content += `\n## Active Context\n${context}\n`;
  }
  
  fs.writeFileSync(file, content);
}

/**
 * Read all memory entries.
 */
function readMemory() {
  const file = getMemoryFilePath();
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf-8');
}

/**
 * Trim memory file to 200 lines. Archive old entries.
 */
function trimIfNeeded(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  if (lines.length <= 200) return;
  
  const archiveFile = getArchiveFilePath();
  const archiveLines = lines.splice(0, lines.length - 200);
  fs.appendFileSync(archiveFile, archiveLines.join('\n') + '\n');
  fs.writeFileSync(file, lines.join('\n'));
}

module.exports = { saveDecision, saveGotcha, updateActiveContext, readMemory, ensureMemoryFile };
