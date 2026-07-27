#!/usr/bin/env node
/**
 * Fusion Optimizer - Stats Tracker
 * Estimates token usage and cost savings based on mode distribution.
 * Used by /fusion-stats command.
 */
const fs = require('fs');
const path = require('path');

// Rough estimate constants (verified against caveman benchmarks)
const ESTIMATES = {
  ZEN: { outputSavings: 0.65, contextSavings: 0.60 },
  BALANCED: { outputSavings: 0.40, contextSavings: 0.30 },
  QUALITY: { outputSavings: 0.25, contextSavings: 0.15 },
};

// Claude API pricing per 1M tokens (approximate, as of mid-2026)
const PRICING = {
  input: 15.00,   // $15 per 1M input tokens (Opus)
  output: 75.00,   // $75 per 1M output tokens (Opus)
};

function calculateStats(sessionState) {
  const { modeHistory = [], turns = 0 } = sessionState || {};
  
  // Count mode distribution
  const distribution = { ZEN: 0, BALANCED: 0, QUALITY: 0 };
  const modeSequence = modeHistory.length > 0 ? modeHistory : ['BALANCED'];
  
  // Distribute turns across modes
  const turnsPerMode = Math.max(1, Math.floor(turns / modeSequence.length));
  let remaining = turns;
  for (let i = 0; i < modeSequence.length && remaining > 0; i++) {
    const mode = modeSequence[i];
    const count = Math.min(turnsPerMode, remaining);
    distribution[mode] = (distribution[mode] || 0) + count;
    remaining -= count;
  }
  
  // Distribute any remaining turns to last mode
  if (remaining > 0) {
    distribution[modeSequence[modeSequence.length - 1]] += remaining;
  }
  
  // Estimate tokens per turn (rough averages)
  const avgInputPerTurn = 2000;  // ~2k input tokens per turn (varies)
  const avgOutputPerTurn = 500;   // ~500 output tokens per turn (before compression)
  
  let totalInput = 0;
  let totalOutput = 0;
  let savedOutput = 0;
  let savedContext = 0;
  
  for (const [mode, count] of Object.entries(distribution)) {
    const est = ESTIMATES[mode];
    const modeInput = count * avgInputPerTurn;
    const modeOutput = count * avgOutputPerTurn;
    
    totalInput += modeInput;
    totalOutput += modeOutput;
    savedOutput += modeOutput * est.outputSavings;
    savedContext += modeInput * est.contextSavings;
  }
  
  const effectiveOutput = totalOutput - savedOutput;
  const effectiveInput = totalInput - savedContext;
  
  // Cost
  const costWithout = (totalInput / 1e6) * PRICING.input + (totalOutput / 1e6) * PRICING.output;
  const costWith = (effectiveInput / 1e6) * PRICING.input + (effectiveOutput / 1e6) * PRICING.output;
  const costSaved = costWithout - costWith;
  const costPercent = costWithout > 0 ? Math.round((costSaved / costWithout) * 100) : 0;
  
  return {
    distribution,
    tokens: {
      input: Math.round(totalInput),
      output: Math.round(totalOutput),
      savedOutput: Math.round(savedOutput),
      savedContext: Math.round(savedContext),
      effectiveInput: Math.round(effectiveInput),
      effectiveOutput: Math.round(effectiveOutput),
      outputSavingsPercent: totalOutput > 0 ? Math.round((savedOutput / totalOutput) * 100) : 0,
      contextSavingsPercent: totalInput > 0 ? Math.round((savedContext / totalInput) * 100) : 0,
    },
    cost: {
      without: costWithout.toFixed(2),
      with: costWith.toFixed(2),
      saved: costSaved.toFixed(2),
      percent: costPercent,
    },
  };
}

/**
 * Read session state from .fusion/session.json
 */
function readSessionState() {
  const fusionDir = path.join(process.cwd(), '.fusion');
  const sessionFile = path.join(fusionDir, 'session.json');
  
  if (!fs.existsSync(sessionFile)) {
    return { mode: 'BALANCED', turns: 0, modeHistory: ['BALANCED'], failures: 0 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  } catch {
    return { mode: 'BALANCED', turns: 0, modeHistory: ['BALANCED'], failures: 0 };
  }
}

module.exports = { calculateStats, readSessionState, ESTIMATES, PRICING };
