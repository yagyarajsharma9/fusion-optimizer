#!/usr/bin/env node
/**
 * Fusion Optimizer — Shared stdin helper for hooks.
 * Reads piped JSON from stdin synchronously across Windows/Mac/Linux.
 */

function readStdin() {
  const methods = [];

  // Method 1: Read raw stdin (works on most systems)
  try {
    // Node.js on Mac/Linux can read fd 0
    const fs = require('fs');
    const data = fs.readFileSync(0, 'utf-8');
    if (data && data.trim()) return data.trim();
  } catch {}

  // Method 2: /dev/stdin (Mac/Linux fallback)
  try {
    const fs = require('fs');
    const data = fs.readFileSync('/dev/stdin', 'utf-8');
    if (data && data.trim()) return data.trim();
  } catch {}

  return '';
}

function parseStdinEvent() {
  const raw = readStdin();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { readStdin, parseStdinEvent };
