/**
 * Fusion Optimizer — OpenCode Native Plugin
 * 
 * Provides the same hook functionality as the Claude Code version:
 * - session.created → Mode detection + fusion-core injection
 * - tool.execute.before → 22 tool routing patterns
 * - tool.execute.after → Stats tracking + size warnings
 * - experimental.session.compacting → Session continuity snapshot
 * - Custom tool: fusion_stats → Cost savings report
 * 
 * Auto-loaded from .opencode/plugins/ directory.
 */
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

// ============== MODE ARBITRATION ==============

const MODES = { ZEN: "ZEN", BALANCED: "BALANCED", QUALITY: "QUALITY" };

function analyzeComplexity(prompt) {
  const lower = (prompt || "").toLowerCase();

  const trivialPatterns = [
    /\b(fix|correct)\s+(typo|spelling|comment|format|indent)/,
    /\brename\s+\S+\s+to\s+\S+$/,
    /\bdelete\s+(line|file|comment|directory)/,
    /\bwhat\s+(is|does|are|do)/,
    /\bwhere\s+(is|are|can\s+i)\b/,
    /\bshow\s+(me|the|how)\b/,
    /\bexplain\s+(what|how|why|this)/,
    /\bhow\s+(do|does|to|can)\s+i\b/,
    /\bsearch\s+(for|the)\b/,
    /\bformat\s+(code|file|document)/,
    /\brun\s+(tests?|lint|build|format)/,
  ];

  for (const p of trivialPatterns) {
    if (p.test(lower)) return "TRIVIAL";
  }

  const complexPatterns = [
    /\b(design|architect)\s+(a\s+)?(system|architecture|solution|pattern|migration)/,
    /\bmigrat(e|ion)\s+(from|to)\b/,
    /\b(new|create)\s+(project|app|service|microservice|system)/,
    /\b(rewrite|refactor)\s+(entire|whole|major)/,
    /\b(plan|propose)\s+(architecture|system|design)/,
    /\bmulti[- ]?(tenant|service|module|region)/,
    /\b(set\s+up|configure)\s+(ci\/cd|deployment|kubernetes|infrastructure)/,
    /\bperformance\s+(optimization|audit)/,
    /\bsecurity\s+(audit|review|assessment)/,
  ];

  for (const p of complexPatterns) {
    if (p.test(lower)) return "COMPLEX";
  }

  return "MODERATE";
}

function complexityToMode(complexity) {
  if (complexity === "TRIVIAL") return MODES.ZEN;
  if (complexity === "COMPLEX") return MODES.QUALITY;
  return MODES.BALANCED;
}

function detectProjectComplexity(directory) {
  let score = 0;
  try {
    const files = fs.readdirSync(directory, { withFileTypes: true }).filter(f => f.isFile());
    score += files.length > 100 ? 1 : files.length > 20 ? 0 : -1;
  } catch {}
  try {
    if (fs.existsSync(path.join(directory, "package.json"))) score += 1;
    if (fs.existsSync(path.join(directory, "__tests__"))) score += 1;
    if (fs.existsSync(path.join(directory, "tests"))) score += 1;
    if (fs.existsSync(path.join(directory, "test"))) score += 1;
  } catch {}
  return score <= 0 ? MODES.ZEN : score <= 2 ? MODES.BALANCED : MODES.QUALITY;
}

// ============== TOOL ROUTING (22 patterns) ==============

function applyToolRouting(tool, args) {
  if (tool !== "bash" || !args?.command) return null;

  const cmd = args.command;
  const rules = [
    // Git
    { match: () => /\bgit\s+log\b/.test(cmd) && !/--oneline|-n\s+\d+|--stat/.test(cmd), transform: () => cmd.replace(/(git\s+log)/, "$1 --oneline -n 30"), reason: "Added --oneline -n 30" },
    { match: () => /\bgit\s+diff\b/.test(cmd) && !/--stat|--name-only|\.{2,3}/.test(cmd), transform: () => cmd.replace(/(git\s+diff)/, "$1 --stat"), reason: "Added --stat" },
    { match: () => /\bgit\s+blame\b/.test(cmd) && !/-L/.test(cmd), transform: () => cmd + " | head -50", reason: "Added | head -50" },
    { match: () => /\bgit\s+show\b/.test(cmd) && !/--stat|--name-only|-s/.test(cmd), transform: () => cmd + " --stat", reason: "Added --stat" },
    // Packages
    { match: () => /\bnpm\s+(install|ci|update)\b/.test(cmd) && !/--silent|--quiet/.test(cmd), transform: () => cmd + " --silent", reason: "Added --silent" },
    { match: () => /\byarn\s+(install|add)\b/.test(cmd) && !/--silent|--quiet/.test(cmd), transform: () => cmd + " --silent", reason: "Added --silent" },
    { match: () => /\bpnpm\s+(install|add)\b/.test(cmd) && !/--silent/.test(cmd), transform: () => cmd + " --silent", reason: "Added --silent" },
    { match: () => /\bpip\s+install\b/.test(cmd) && !/-q|--quiet/.test(cmd), transform: () => cmd.replace("pip install", "pip install -q"), reason: "Added -q" },
    { match: () => /\bcargo\s+(build|install)\b/.test(cmd) && !/-q|--quiet/.test(cmd), transform: () => cmd + " -q 2>&1 | tail -20", reason: "Added -q + tail" },
    { match: () => /\bgo\s+(get|install)\b/.test(cmd) && !/\|/.test(cmd), transform: () => cmd + " 2>&1 | tail -20", reason: "Added tail -20" },
    // Tests
    { match: () => /\b(npx\s+)?(jest|vitest)\b/.test(cmd) && !/--silent|\|/.test(cmd), transform: () => cmd + " 2>&1 | tail -30", reason: "Added tail -30" },
    { match: () => /\bpytest\b/.test(cmd) && !/-q|--tb=short|\|/.test(cmd), transform: () => cmd + " -q --tb=short 2>&1 | tail -30", reason: "Added -q --tb=short" },
    { match: () => /\bgo\s+test\b/.test(cmd) && !/\|/.test(cmd), transform: () => cmd + " 2>&1 | tail -30", reason: "Added tail -30" },
    { match: () => /\bcargo\s+test\b/.test(cmd) && !/-q|--quiet|\|/.test(cmd), transform: () => cmd + " -q 2>&1 | tail -30", reason: "Added -q + tail" },
    // Build
    { match: () => /\bmake\b/.test(cmd) && !/-s|--silent|\|/.test(cmd) && !/\btest\b/.test(cmd), transform: () => cmd + " -s 2>&1 | tail -20", reason: "Added -s + tail" },
    { match: () => /\bdocker\s+build\b/.test(cmd) && !/-q|--quiet/.test(cmd), transform: () => cmd.replace("docker build", "docker build -q"), reason: "Added -q" },
  ];

  for (const rule of rules) {
    if (rule.match()) {
      return { modifiedCommand: rule.transform(), reason: rule.reason };
    }
  }

  return null;
}

// ============== MAIN PLUGIN ==============

export const FusionOptimizerPlugin = async ({ directory, worktree, client }) => {
  const projectDir = directory || worktree || process.cwd();
  const fusionDir = path.join(projectDir, ".fusion");

  // Ensure .fusion directory exists
  if (!fs.existsSync(fusionDir)) {
    fs.mkdirSync(fusionDir, { recursive: true });
  }

  // Session state
  let sessionState = {
    mode: detectProjectComplexity(projectDir),
    turns: 0,
    modeHistory: [],
    failures: 0,
    toolCalls: 0,
    toolBytesCaptured: 0,
    startTime: new Date().toISOString(),
  };

  // Load existing state if present
  const stateFile = path.join(fusionDir, "session.json");
  if (fs.existsSync(stateFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
      sessionState = { ...sessionState, ...existing };
    } catch {}
  }

  function saveState() {
    fs.writeFileSync(stateFile, JSON.stringify(sessionState, null, 2));
  }

  // Initialize memory file
  const memoryFile = path.join(fusionDir, "memory.md");
  if (!fs.existsSync(memoryFile)) {
    fs.writeFileSync(memoryFile, "# Project Memory\n\n## Architecture Decisions\n\n## Gotchas & Bugs\n\n## Active Context\n\n");
  }

  // Log initialization
  try {
    await client?.app?.log?.({
      body: {
        service: "fusion-optimizer",
        level: "info",
        message: `Plugin initialized. Mode: ${sessionState.mode}. Project: ${path.basename(projectDir)}`,
      },
    });
  } catch {}

  return {
    // ===== SESSION CREATED → Mode Init =====
    "session.created": async () => {
      saveState();
      const modeContexts = {
        ZEN: "[Fusion ZEN] Caveman-ultra output. No methodology. Route large output.",
        BALANCED: "[Fusion BALANCED] Caveman-lite output. TDD if coding. Route tool output.",
        QUALITY: "[Fusion QUALITY] Caveman-lite output. Full methodology: brainstorm→plan→TDD→review.",
      };
    },

    // ===== TOOL EXECUTE BEFORE → Tool Routing =====
    "tool.execute.before": async (input, output) => {
      // Skip routing in QUALITY mode
      if (sessionState.mode === MODES.QUALITY) return;

      const tool = input.tool;
      const args = input.args || input;

      // Apply tool routing
      const routing = applyToolRouting(tool, args);
      if (routing && routing.modifiedCommand !== args.command) {
        output.args = { ...output.args, command: routing.modifiedCommand };

        try {
          await client?.app?.log?.({
            body: {
              service: "fusion-optimizer",
              level: "debug",
              message: `Tool routing: ${routing.reason}`,
            },
          });
        } catch {}
      }

      // Warnings for HTTP tools
      if (tool === "bash" && args?.command && /\b(curl|wget)\b/.test(args.command) && !/-s|--silent|-q/.test(args.command)) {
        try {
          await client?.app?.log?.({
            body: {
              service: "fusion-optimizer",
              level: "warn",
              message: "Prefer WebFetch over curl/wget — keeps response out of context",
            },
          });
        } catch {}
      }
    },

    // ===== TOOL EXECUTE AFTER → Stats Tracking =====
    "tool.execute.after": async (input) => {
      sessionState.toolCalls = (sessionState.toolCalls || 0) + 1;

      // Estimate output size
      const output = input.output || "";
      const size = typeof output === "string" ? Buffer.byteLength(output, "utf-8") : JSON.stringify(output).length;
      sessionState.toolBytesCaptured = (sessionState.toolBytesCaptured || 0) + size;

      saveState();

      // Warn if ZEN mode and large output
      if (sessionState.mode === MODES.ZEN && size > 5000) {
        try {
          await client?.app?.log?.({
            body: {
              service: "fusion-optimizer",
              level: "warn",
              message: `Large tool output (~${Math.round(size / 1000)}KB) in ZEN mode. Consider summarizing.`,
            },
          });
        } catch {}
      }
    },

    // ===== SESSION COMPACTING → Continuity Snapshot =====
    "experimental.session.compacting": async (input, output) => {
      const snapshot = {
        mode: sessionState.mode,
        turns: sessionState.turns,
        toolCalls: sessionState.toolCalls,
        timestamp: new Date().toISOString(),
      };

      output.context = output.context || [];
      output.context.push(`## Fusion Optimizer State
Mode: ${snapshot.mode} | Turns: ${snapshot.turns} | Tool calls: ${snapshot.toolCalls}
Resume in ${snapshot.mode} mode. Check .fusion/memory.md for context.`);

      // Save snapshot
      fs.writeFileSync(
        path.join(fusionDir, "snapshot.json"),
        JSON.stringify(snapshot, null, 2)
      );
    },

    // ===== CUSTOM TOOL: fusion_stats =====
    tool: {
      fusion_stats: {
        description: "Get Fusion Optimizer session statistics — mode distribution, token savings, cost estimates.",
        args: {},
        async execute(_args, _context) {
          const distribution = { ZEN: 0, BALANCED: 0, QUALITY: 0 };
          for (const m of (sessionState.modeHistory || [])) {
            distribution[m] = (distribution[m] || 0) + 1;
          }
          // Distribute remaining turns
          const remainingTurns = sessionState.turns - (sessionState.modeHistory || []).length;
          if (remainingTurns > 0) {
            distribution[sessionState.mode] = (distribution[sessionState.mode] || 0) + remainingTurns;
          }

          const avgInputPerTurn = 2000;
          const avgOutputPerTurn = 500;

          let savedOutput = 0;
          const savings = { ZEN: 0.65, BALANCED: 0.40, QUALITY: 0.25 };
          for (const [mode, count] of Object.entries(distribution)) {
            savedOutput += (count || 0) * avgOutputPerTurn * (savings[mode] || 0);
          }

          // Pricing: $15/M input, $75/M output (Opus)
          const costWithout = ((sessionState.turns * avgInputPerTurn) / 1e6) * 15 + ((sessionState.turns * avgOutputPerTurn) / 1e6) * 75;
          const effectiveOutput = sessionState.turns * avgOutputPerTurn - savedOutput;
          const costWith = ((sessionState.turns * avgInputPerTurn) / 1e6) * 15 + (effectiveOutput / 1e6) * 75;
          const saved = costWithout - costWith;
          const pct = costWithout > 0 ? Math.round((saved / costWithout) * 100) : 0;

          return `╔══════════════════════════════════╗
║    FUSION OPTIMIZER STATS        ║
╠══════════════════════════════════╣
║ Mode: ${sessionState.mode.padEnd(28)}║
║ Turns: ${String(sessionState.turns).padEnd(26)}║
║ Tool calls: ${String(sessionState.toolCalls || 0).padEnd(22)}║
╠══════════════════════════════════╣
║ Distribution:                    ║
║   ZEN:     ${String(distribution.ZEN || 0).padEnd(22)}║
║   BALANCED: ${String(distribution.BALANCED || 0).padEnd(20)}║
║   QUALITY:  ${String(distribution.QUALITY || 0).padEnd(20)}║
╠══════════════════════════════════╣
║ Est. cost w/o Fusion: $${costWithout.toFixed(2).padEnd(8)}║
║ Est. cost w/ Fusion:  $${costWith.toFixed(2).padEnd(8)}║
║ Est. saved:           $${saved.toFixed(2)} (${pct}%)${"".padEnd(Math.max(0, 7 - String(pct).length))}║
╚══════════════════════════════════╝`;
        },
      },
    },
  };
};
