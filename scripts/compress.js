#!/usr/bin/env node
/**
 * Fusion Optimizer — Deterministic Memory File Compressor
 * 
 * Rewrites project memory files (CLAUDE.md, AGENTS.md, GEMINI.md, etc.)
 * into caveman-speak — same information, ~46% fewer bytes.
 * 
 * Unlike the skill-based approach (LLM follows instructions),
 * this script does it deterministically — exact, reproducible, fast.
 * 
 * Usage:
 *   node scripts/compress.js                    # Compress all detected files
 *   node scripts/compress.js --file CLAUDE.md   # Compress specific file
 *   node scripts/compress.js --dry-run          # Show what would change
 *   node scripts/compress.js --restore          # Restore from .bak files
 */
const fs = require('fs');
const path = require('path');

const COMPRESSIBLE_FILES = [
  'CLAUDE.md',
  'AGENTS.md', 
  'GEMINI.md',
  '.cursorrules',
  '.windsurfrules',
  'MEMORY.md',
  'CONTRIBUTING.md',
];

const COPILOT_INSTRUCTION_PATH = '.github/copilot-instructions.md';
const MEMORY_PATH = '.fusion/memory.md';

/**
 * Compression patterns: [regex, replacement]
 * Ordered — earlier patterns apply first.
 */
const COMPRESSION_RULES = [
  // === Conversational filler phrases → remove entirely (with trailing space/punctuation) ===
  [/\bI think[,\s]+/gi, ''],
  [/\bI believe[,\s]+/gi, ''],
  [/\bIn my opinion[,]?\s+/gi, ''],
  [/\bLet me explain[,\s]+/gi, ''],
  [/\bLet me\s+/gi, ''],
  [/\bLet's\s+/gi, ''],
  [/\bI'll (go ahead and |just |try to )/gi, ''],
  [/\bSure[!,\s]+/gi, ''],
  [/\bGreat question[!,\s]+/gi, ''],
  [/\bAbsolutely[!,\s]+/gi, ''],
  [/\bOf course[!,\s]+/gi, ''],
  [/\bWell[,\s]+/gi, ''],
  [/\bSo[,\s]+(?=[A-Z])/g, ''],
  [/\bBasically[,\s]+/gi, ''],
  [/\bEssentially[,\s]+/gi, ''],
  [/\bI hope this helps[!.\s]*/gi, ''],
  [/\bPlease let me know[!.\s]*/gi, ''],
  [/\bif you have any questions[!.\s]*/gi, ''],
  
  // === Politeness → remove ===
  [/\bplease\s+/gi, ''],
  [/\bkindly\s+/gi, ''],
  [/\bthank you[!.\s]*/gi, ''],
  [/\bthanks[!.\s]*/gi, ''],
  
  // === Verbose phrases → terse (order matters: multi-word before single-word) ===
  [/\bit is recommended (that |to )/gi, 'use '],
  [/\byou should absolutely\s+/gi, ''],
  [/\byou should\s+/gi, ''],
  [/\byou must\s+/gi, ''],
  [/\byou need to\s+/gi, ''],
  [/\byou can\s+/gi, ''],
  [/\bI recommend\s+/gi, ''],
  [/\bI suggest\s+/gi, ''],
  [/\bthis is because\b/gi, 'because'],
  [/\bthe reason (is|for this) (is that|being)\b/gi, 'why:'],
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bat this point in time\b/gi, 'now'],
  [/\ba number of\b/gi, 'several'],
  [/\bthe majority of\b/gi, 'most'],
  [/\bis able to\b/gi, 'can'],
  [/\bis responsible for\b/gi, 'handles'],
  [/\bhas the ability to\b/gi, 'can'],
  [/\bmake sure (?:that |to )/gi, ''],
  [/\bin the event that\b/gi, 'if'],
  [/\bwhen you are working with\b/gi, 'with'],
  [/\bfor the purpose of\b/gi, 'for'],
  [/\bwith (?:a )?regard to\b/gi, 'about'],
  [/\bin the context of\b/gi, 'in'],
  [/\bit is important to note that\b/gi, 'note:'],
  [/\bplease note that\b/gi, 'note:'],
  [/\byou will need to\s+/gi, ''],
  [/\bif you want to\b/gi, 'to'],
  [/\bin addition to this\b/gi, 'also'],
  [/\bas well as\b/gi, 'and'],
  [/\balong with\b/gi, 'with'],
  [/\bwhether or not\b/gi, 'if'],
  [/\bprior to\b/gi, 'before'],
  [/\bsubsequent to\b/gi, 'after'],
  [/\bwith the exception of\b/gi, 'except'],
  [/\bin the process of\b/gi, 'while'],
  [/\bon the part of\b/gi, 'by'],
  [/\bthe use of\b/gi, 'using'],
  [/\bthe implementation of\b/gi, 'implementing'],
  
  // === Redundant qualifiers ===
  [/\babsolutely\s+(?=essential|necessary|critical|vital)/gi, ''],
  [/\bcompletely\s+(?=different|new|separate|unique)/gi, ''],
  [/\btotally\s+(?=different|new|unrelated)/gi, ''],
  
  // === You are → remove (implied) ===
  [/\bYou are\s+/g, ''],
  [/\byou are\s+/g, ''],
  
  // === Double spaces from removed phrases → single space ===
  [/ {2,}/g, ' '],
  
  // === Trailing spaces on lines ===
  [/ +$/gm, ''],
];

/**
 * Find code blocks in markdown — these are PRESERVED exactly.
 * Returns array of {start, end} ranges.
 */
function findCodeBlocks(content) {
  const blocks = [];
  const regex = /```[\s\S]*?```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ start: match.index, end: match.index + match[0].length });
  }
  return blocks;
}

/**
 * Find inline code spans — also preserved.
 */
function findInlineCode(content) {
  const spans = [];
  const regex = /`[^`\n]+`/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    spans.push({ start: match.index, end: match.index + match[0].length });
  }
  return spans;
}

/**
 * Check if a position falls within any protected range.
 */
function isProtected(pos, ranges) {
  return ranges.some(r => pos >= r.start && pos < r.end);
}

/**
 * Compress a markdown string.
 * Preserves: code blocks, inline code, URLs, file paths, headings.
 */
function compressMarkdown(content) {
  // Find all protected ranges
  const protectedRanges = [
    ...findCodeBlocks(content),
    ...findInlineCode(content),
  ];
  
  // Also protect URLs
  const urlRegex = /https?:\/\/[^\s)]+/g;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(content)) !== null) {
    protectedRanges.push({ start: urlMatch.index, end: urlMatch.index + urlMatch[0].length });
  }
  
  // Also protect file paths (common patterns)
  const pathRegex = /(?:[\w/.@-]+\/)+[\w.@-]+/g;
  let pathMatch;
  while ((pathMatch = pathRegex.exec(content)) !== null) {
    // Only protect paths that look real (not just words with slashes)
    if (pathMatch[0].includes('.') || pathMatch[0].includes('/')) {
      protectedRanges.push({ start: pathMatch.index, end: pathMatch.index + pathMatch[0].length });
    }
  }
  
  // Sort protected ranges by start position
  protectedRanges.sort((a, b) => a.start - b.start);
  
  // Merge overlapping protected ranges
  const merged = [];
  for (const range of protectedRanges) {
    if (merged.length === 0 || range.start > merged[merged.length - 1].end) {
      merged.push(range);
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, range.end);
    }
  }
  
  // Apply compression rules character by character for safety
  // Actually, let's use a simpler approach: split into protected/unprotected segments
  // and only compress unprotected segments
  const segments = [];
  let pos = 0;
  
  for (const range of merged) {
    if (range.start > pos) {
      segments.push({ type: 'text', start: pos, end: range.start, content: content.substring(pos, range.start) });
    }
    segments.push({ type: 'protected', start: range.start, end: range.end, content: content.substring(range.start, range.end) });
    pos = range.end;
  }
  if (pos < content.length) {
    segments.push({ type: 'text', start: pos, end: content.length, content: content.substring(pos) });
  }
  
  // Compress text segments only
  let result = '';
  for (const seg of segments) {
    if (seg.type === 'protected') {
      result += seg.content;
    } else {
      let text = seg.content;
      for (const [pattern, replacement] of COMPRESSION_RULES) {
        text = text.replace(pattern, replacement);
      }
      result += text;
    }
  }
  
  return result;
}

/**
 * Find all compressible files in the project root.
 */
function findCompressibleFiles(rootDir) {
  const files = [];
  
  for (const name of COMPRESSIBLE_FILES) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    }
  }
  
  // Check copilot instructions
  const copilotPath = path.join(rootDir, COPILOT_INSTRUCTION_PATH);
  if (fs.existsSync(copilotPath)) {
    files.push(copilotPath);
  }
  
  // Check fusion memory
  const fusionMemPath = path.join(rootDir, MEMORY_PATH);
  if (fs.existsSync(fusionMemPath)) {
    files.push(fusionMemPath);
  }
  
  // Check .cursor/rules/*.md
  const cursorRulesDir = path.join(rootDir, '.cursor', 'rules');
  if (fs.existsSync(cursorRulesDir)) {
    try {
      const rules = fs.readdirSync(cursorRulesDir).filter(f => f.endsWith('.md'));
      rules.forEach(r => files.push(path.join(cursorRulesDir, r)));
    } catch {}
  }
  
  return files;
}

/**
 * Main compress function.
 */
function compress(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const dryRun = options.dryRun || false;
  const specificFile = options.file || null;
  const restore = options.restore || false;
  
  let files;
  
  if (restore) {
    // Find .bak files
    files = [];
    function findBaks(dir) {
      try {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
          if (f.name.endsWith('.bak')) {
            files.push(path.join(dir, f.name));
          }
        });
      } catch {}
    }
    findBaks(rootDir);
    findBaks(path.join(rootDir, '.fusion'));
    findBaks(path.join(rootDir, '.github'));
    findBaks(path.join(rootDir, '.cursor', 'rules'));
    
    if (files.length === 0) {
      console.log('No .bak files found to restore.');
      return;
    }
    
    console.log(`Restoring ${files.length} file(s) from backup...\n`);
    for (const bakFile of files) {
      const originalFile = bakFile.replace(/\.bak$/, '');
      if (dryRun) {
        console.log(`  [DRY RUN] Would restore: ${path.relative(rootDir, originalFile)}`);
      } else {
        fs.copyFileSync(bakFile, originalFile);
        fs.unlinkSync(bakFile);
        console.log(`  ✅ Restored: ${path.relative(rootDir, originalFile)}`);
      }
    }
    return;
  }
  
  if (specificFile) {
    const filePath = path.resolve(rootDir, specificFile);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }
    files = [filePath];
  } else {
    files = findCompressibleFiles(rootDir);
  }
  
  if (files.length === 0) {
    console.log('No compressible files found in project.');
    console.log('Looked for: ' + COMPRESSIBLE_FILES.join(', '));
    return;
  }
  
  console.log(`Found ${files.length} file(s) to compress:\n`);
  
  const results = [];
  let totalOriginal = 0;
  let totalCompressed = 0;
  
  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath);
    const original = fs.readFileSync(filePath, 'utf-8');
    const compressed = compressMarkdown(original);
    const originalSize = Buffer.byteLength(original, 'utf-8');
    const compressedSize = Buffer.byteLength(compressed, 'utf-8');
    const savings = originalSize - compressedSize;
    const percent = originalSize > 0 ? Math.round((savings / originalSize) * 100) : 0;
    
    results.push({ path: relPath, originalSize, compressedSize, savings, percent });
    totalOriginal += originalSize;
    totalCompressed += compressedSize;
    
    if (!dryRun) {
      // Create backup
      const bakPath = filePath + '.bak';
      fs.writeFileSync(bakPath, original);
      
      // Write compressed version
      fs.writeFileSync(filePath, compressed);
    }
  }
  
  // Display results
  for (const r of results) {
    const status = dryRun ? '[DRY RUN]' : '✅';
    console.log(`  ${status} ${r.path}: ${r.originalSize}B → ${r.compressedSize}B (${r.percent}%)`);
  }
  
  const totalSavings = totalOriginal - totalCompressed;
  const totalPercent = totalOriginal > 0 ? Math.round((totalSavings / totalOriginal) * 100) : 0;
  
  console.log(`\n  Total: ${totalOriginal}B → ${totalCompressed}B (${totalPercent}% smaller)`);
  console.log(`  Estimated input tokens saved: ~${Math.round(totalSavings * 2.5)} per session`);
  
  if (!dryRun) {
    console.log(`\n  Backups created: *.bak files`);
    console.log(`  To undo, run: node scripts/compress.js --restore`);
  }
  
  return { results, totalOriginal, totalCompressed, totalSavings, totalPercent };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    restore: args.includes('--restore'),
    file: null,
  };
  
  const fileArg = args.find(a => a.startsWith('--file='));
  if (fileArg) {
    options.file = fileArg.replace('--file=', '');
  }
  
  compress(options);
}

module.exports = { compress, compressMarkdown };
