#!/usr/bin/env node
/**
 * Fusion Optimizer - PreCompact Hook
 * Saves session state before context compaction.
 * Ensures the agent can resume from where it left off.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const { parseStdinEvent } = require(path.join(__dirname, 'stdin-helper.js'));
const event = parseStdinEvent();
if (!event) process.exit(0);
} catch {
  process.exit(0);
}

const fusionDir = path.join(process.cwd(), '.fusion');
const sessionFile = path.join(fusionDir, 'session.json');
const memoryFile = path.join(fusionDir, 'memory.md');

// Read current state
let state = { mode: 'BALANCED', turns: 0 };
if (fs.existsSync(sessionFile)) {
  try {
    state = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  } catch {}
}

// Build snapshot for post-compaction resume
const snapshot = {
  mode: state.mode,
  turns: state.turns,
  modeHistory: state.modeHistory,
  timestamp: new Date().toISOString(),
};

// Save snapshot
const snapshotFile = path.join(fusionDir, 'snapshot.json');
fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));

// Update memory with session end marker
if (fs.existsSync(memoryFile)) {
  const memory = fs.readFileSync(memoryFile, 'utf-8');
  const updatedMemory = memory + `\n## Session checkpoint: ${snapshot.timestamp}\n- Mode: ${snapshot.mode}\n- Turns: ${snapshot.turns}\n`;
  
  // Trim memory if too long (keep under 200 lines)
  const lines = updatedMemory.split('\n');
  if (lines.length > 200) {
    const archiveFile = path.join(fusionDir, 'memory-archive.md');
    const archive = lines.slice(0, lines.length - 200).join('\n');
    fs.appendFileSync(archiveFile, archive + '\n');
    lines.splice(0, lines.length - 200);
    fs.writeFileSync(memoryFile, lines.join('\n'));
  } else {
    // Just write if not too long
    const trimmed = lines.slice(-200).join('\n');
    fs.writeFileSync(memoryFile, trimmed.length > updatedMemory.length ? updatedMemory : trimmed);
  }
}

// Output resume context for post-compaction injection
process.stdout.write(JSON.stringify({
  context: `<fusion-snapshot>
Mode: ${snapshot.mode} | Turns: ${snapshot.turns} | ${snapshot.timestamp}
Resume: continue in ${snapshot.mode} mode. Check .fusion/memory.md for context.
</fusion-snapshot>`,
  snapshot,
}));

process.exit(0);
