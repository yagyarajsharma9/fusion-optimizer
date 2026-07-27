#!/usr/bin/env node
/**
 * Fusion Optimizer - Compressor
 * Output compression rules. Used by skills to format responses in caveman style.
 * 
 * Not run as a separate process — these are reference rules embedded in skills.
 */

/**
 * Compression levels for output formatting:
 * 
 * LITE (40% reduction):
 *   - Drop conversational filler: "I think", "let me", "I'll go ahead and", "sure!", "great question"
 *   - Replace "you should" → "use", "I recommend" → "recommend"
 *   - Replace "this is because" → "because", "the reason is" → "why:"
 *   - Keep full sentences and explanations
 * 
 * ULTRA (65% reduction):
 *   - All LITE rules
 *   - Fragment sentences, no articles: "the bug is on line 42" → "bug L42"
 *   - Bullet points over paragraphs
 *   - Single words over phrases: "implement" over "go ahead and implement"
 *   - Status as symbols: PENDING → ⏳, DONE → ✓, BLOCKED → 🚫
 *   - NEVER compress: code blocks, file paths, identifiers, error messages
 * 
 * CODE REVIEW (50% reduction):
 *   - Format: "L42: 🔴 severity: description. Suggestion."
 *   - One line per finding, max 5 findings
 * 
 * COMMIT MESSAGES (70% reduction):
 *   - Conventional commits: "type(scope): ≤50 char description"
 *   - types: feat, fix, refactor, test, docs, chore, perf, style
 */

module.exports = {
  levels: {
    LITE: {
      dropPhrases: [
        /^I think\s+/i, /^I believe\s+/i, /^In my opinion\s+/i,
        /^Let me\s+/i, /^Let's\s+/i,
        /^I'll\s+(go ahead and|just|try to)\s+/i,
        /^Sure[!,\s]+/i, /^Great question[!,\s]+/i,
        /^Absolutely[!,\s]+/i, /^Of course[!,\s]+/i,
        /^Well[,\s]+/i, /^So[,\s]+/i,
        /^Basically[,\s]+/i, /^Essentially[,\s]+/i,
      ],
      replacements: [
        [/\byou should\b/gi, 'use'],
        [/\bI recommend\b/gi, 'recommend'],
        [/\bI suggest\b/gi, 'suggest'],
        [/\bthis is because\b/gi, 'because'],
        [/\bthe reason (is|for this) (is|being)\b/gi, 'why:'],
        [/\bin order to\b/gi, 'to'],
        [/\bdue to the fact that\b/gi, 'because'],
        [/\bat this point in time\b/gi, 'now'],
        [/\ba number of\b/gi, 'several'],
        [/\bthe majority of\b/gi, 'most'],
        [/\bis able to\b/gi, 'can'],
        [/\bis responsible for\b/gi, 'handles'],
        [/\bhas the ability to\b/gi, 'can'],
      ],
    },
    
    ULTRA: {
      format: 'fragments',
      rules: [
        'Drop articles (a, an, the) when not needed for clarity',
        'Use fragments, not sentences: "Bug: null ref at L42" not "There is a bug where..."',
        'Bullet lists over paragraphs',
        'Status symbols: ✓ done, ⏳ pending, 🚫 blocked, ⚠ warning',
        'NEVER compress: code blocks, file paths, identifiers, error messages, URLs',
        'Keep language: if user writes Spanish, output Spanish. Compression is style, not translation.',
      ],
    },
    
    CODE_REVIEW: {
      format: 'L{line}: {🔴|🟡|🟢} {severity}: {description}. {suggestion}',
      severity: {
        critical: '🔴',
        warning: '🟡',
        suggestion: '🟢',
      },
      maxComments: 5,
    },
    
    COMMIT: {
      format: '{type}({scope}): {≤50 char description}',
      types: ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'perf', 'style', 'ci', 'revert'],
    },
  },
};
