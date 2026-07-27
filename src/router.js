#!/usr/bin/env node
/**
 * Fusion Optimizer — Router Reference (Expanded)
 * 
 * This is a REFERENCE file — all routing logic now lives in hooks/pretooluse.js.
 * Kept as documentation of all supported routing patterns.
 * 
 * 15+ patterns across 6 categories:
 * - Git: log, diff, blame, show
 * - Packages: npm, yarn, pnpm, pip, cargo, go
 * - Tests: jest, vitest, pytest, go test, cargo test
 * - Build: make, docker build
 * - HTTP: curl, wget
 * - Files: find, ls, cat, Read, Grep
 */

const ROUTING_PATTERNS = {
  GIT: {
    'log': '--oneline -n 30',
    'diff': '--stat',
    'blame': '| head -50',
    'show': '--stat',
  },
  PACKAGES: {
    'npm install/ci/update': '--silent',
    'yarn install/add': '--silent',
    'pnpm install/add': '--silent',
    'pip install': '-q',
    'cargo build/install/update': '-q 2>&1 | tail -20',
    'go get/install': '2>&1 | tail -20',
  },
  TESTS: {
    'jest/vitest': '2>&1 | tail -30',
    'pytest': '-q --tb=short 2>&1 | tail -30',
    'go test': '2>&1 | tail -30',
    'cargo test': '-q 2>&1 | tail -30',
  },
  BUILD: {
    'make': '-s 2>&1 | tail -20',
    'docker build': '-q',
  },
  HTTP: {
    'curl': 'WARN: prefer WebFetch',
    'wget': 'WARN: prefer WebFetch',
  },
  FILES: {
    'find unbounded': 'WARN: add -maxdepth or | head',
    'ls -R': 'WARN: use Glob tool',
    'cat': 'WARN: use Read with offset',
    'Read (no offset/limit)': 'WARN: use offset for large files',
    'Grep (no include)': 'WARN: add file filter',
  },
};

module.exports = { ROUTING_PATTERNS };
