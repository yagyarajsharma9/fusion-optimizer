#!/usr/bin/env node
/**
 * Fusion Optimizer - Arbitrator Engine
 * Core mode selection logic. Shared between hooks and skills.
 * 
 * Usage:
 *   const { determineMode, analyzeComplexity, pickSkills } = require('./arbitrator');
 */
const fs = require('fs');
const path = require('path');

const MODES = {
  ZEN: 'ZEN',
  BALANCED: 'BALANCED',
  QUALITY: 'QUALITY',
};

/**
 * Determine optimal mode given prompt, session state, and budget.
 */
function determineMode({ prompt, sessionState, budgetUsed }) {
  // 1. Explicit override from prompt
  const explicitMode = detectExplicitMode(prompt);
  if (explicitMode) return explicitMode;

  // 2. Budget pressure: if >80% used, force ZEN
  if (budgetUsed > 0.8) return MODES.ZEN;

  // 3. Escalation: 3+ consecutive failures → QUALITY
  if (sessionState?.failures >= 3) return MODES.QUALITY;

  // 4. Task complexity detection
  const complexity = analyzeComplexity(prompt);
  
  // 5. If currently in a higher mode and task is simple, stay (don't drop till explicit)
  if (sessionState?.mode === MODES.QUALITY && complexity !== 'COMPLEX') {
    return sessionState.mode;
  }

  return complexityToMode[complexity] || MODES.BALANCED;
}

/**
 * Analyze task complexity from user prompt.
 * Returns: 'TRIVIAL', 'MODERATE', or 'COMPLEX'
 */
function analyzeComplexity(prompt) {
  const lower = (prompt || '').toLowerCase();
  
  const trivialPatterns = [
    /\b(fix|correct)\s+(typo|spelling|comment|format|indent)\b/,
    /\brename\s+\S+(\s+to\s+\S+)?$/,
    /\bdelete\s+(line|file|comment|directory)\b/,
    /\bwhat\s+(is|does|are|do)\b/,
    /\bwhere\s+(is|are|can\s+i)\b/,
    /\bfind\s+(all|the|where|in)\b/,
    /\bshow\s+(me|the|how)\b/,
    /\bexplain\s+(what|how|why|this)\b/,
    /\bhow\s+(do|does|to|can|would|should)\s+i\b/,
    /\bsearch\s+(for|the)\b/,
    /\blook\s+(up|for|at)\b/,
    /\badd\s+(a\s+)?(comment|doc|type|log)\b/,
    /\bupdate\s+(readme|docs|comment|changelog)\b/,
    /\bformat\s+(code|file|document)\b/,
    /\blint\s+(fix|check|errors)\b/,
    /\brun\s+(tests?|lint|build|format)\b/,
    /\bcheck\s+(if|whether|the|for)\b/,
    /\bwhich\s+(file|package|version|branch)\b/,
    /\b(git\s+)?status\b/,
  ];

  for (const pattern of trivialPatterns) {
    if (pattern.test(lower)) return 'TRIVIAL';
  }
  
  const complexPatterns = [
    /\b(design|architect)\s+(a\s+)?(new\s+)?(system|architecture|solution|pattern|migration)/,
    /\bmigrat(e|ion)\s+(from|to|the|this)\b.{0,30}\b(to|from)\b/,
    /\b(new|create|scaffold|init)\s+(a\s+)?(new\s+)?(project|app|application|service|microservice|system)/,
    /\b(rewrite|refactor)\s+(entire|whole|major|complete|the)\b/,
    /\b(plan|propose|design|architect)\s+(a\s+)?(solution|architecture|system|approach)/,
    /\b(implement|build|create)\s+(a\s+)?(auth|payment|search|notification|pipeline|workflow|orchestrator)/,
    /\bmulti[- ]?(tenant|service|module|region|cloud)\b/,
    /\b(set\s+up|configure)\s+(ci\/cd|deployment|kubernetes|docker|infrastructure)/,
    /\bscale\s+(the|this|our|to)\b/,
    /\bperformance\s+(optimization|audit|improvement|review)/,
    /\bsecurity\s+(audit|review|assessment|penetration)/,
    /\bdata\s+(migration|modeling|pipeline|warehouse)/,
  ];

  for (const pattern of complexPatterns) {
    if (pattern.test(lower)) return 'COMPLEX';
  }

  return 'MODERATE';
}

/**
 * Map complexity to mode.
 */
const complexityToMode = {
  TRIVIAL: MODES.ZEN,
  MODERATE: MODES.BALANCED,
  COMPLEX: MODES.QUALITY,
};

/**
 * Detect explicit mode override in prompt.
 */
function detectExplicitMode(prompt) {
  const lower = (prompt || '').toLowerCase();
  if (/@zen\b|zen\s+mode|cost\s+mode|budget\s+mode|cheap\s+mode/.test(lower)) return MODES.ZEN;
  if (/@quality\b|quality\s+mode|full\s+mode|methodology\s+mode/.test(lower)) return MODES.QUALITY;
  if (/@balanced\b|balanced\s+mode|default\s+mode|normal\s+mode/.test(lower)) return MODES.BALANCED;
  return null;
}

/**
 * Pick which Fusion skills to load for a given mode and task type.
 */
function pickSkills(mode, prompt) {
  const lower = (prompt || '').toLowerCase();
  const skills = ['fusion-core']; // Always loaded
  
  if (mode === MODES.ZEN) {
    // Only core in ZEN mode
    return skills;
  }
  
  if (mode === MODES.BALANCED || mode === MODES.QUALITY) {
    // Detect task type
    const isCoding = /\b(code|implement|build|create|add|write|refactor|fix|bug|error|feature|function|class|module|component)\b/.test(lower);
    const isDebugging = /\b(bug|error|crash|fail|broken|wrong|debug|fix|why|not\s+working)\b/.test(lower);
    const isDesign = /\b(design|architect|plan|brainstorm|structure|organize)\b/.test(lower);
    const isReview = /\b(review|check|audit|inspect|examine)\b/.test(lower);
    
    if (isCoding && !isDebugging) skills.push('fusion-tdd');
    if (isDebugging) skills.push('fusion-debugging', 'fusion-tdd');
    if (isDesign) skills.push('fusion-brainstorming');
    if (isReview) skills.push('fusion-review');
    
    // In QUALITY, always include extra methodology
    if (mode === MODES.QUALITY) {
      if (!skills.includes('fusion-brainstorming')) skills.push('fusion-brainstorming');
      if (!skills.includes('fusion-tdd')) skills.push('fusion-tdd');
      if (!skills.includes('fusion-review')) skills.push('fusion-review');
    }
    
    skills.push('fusion-memory');
  }
  
  return skills;
}

module.exports = { MODES, determineMode, analyzeComplexity, detectExplicitMode, pickSkills };
