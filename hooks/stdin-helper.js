#!/usr/bin/env node
/**
 * Fusion Optimizer — Shared stdin helper for hooks.
 * Reads piped JSON from stdin synchronously across Windows/Mac/Linux.
 */
const fs = require('fs');

function readStdin() {
  // Try fd 0 first (works on Mac/Linux)
  try {
    const data = fs.readFileSync(0, 'utf-8');
    if (data && data.trim()) return data.trim();
  } catch {}

  // Fallback: read from /dev/stdin
  try {
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
