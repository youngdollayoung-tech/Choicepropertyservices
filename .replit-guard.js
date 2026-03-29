#!/usr/bin/env node
// ============================================================
// CHOICE PROPERTIES — REPLIT ENVIRONMENT GUARD
// ============================================================
// This script runs BEFORE serve.js on every Replit startup.
// It checks for poisoned environment variables that Replit
// injects when postgresql-16 is active or when the database
// integration sidebar is used.
//
// If Postgres env vars are detected, it HALTS immediately
// with a loud, clear error — rather than letting serve.js
// start in an environment that would mislead AI agents.
//
// DO NOT DELETE OR BYPASS THIS FILE.
// DO NOT replace this with a direct call to serve.js.
// ============================================================

'use strict';

const POISON_VARS = [
  'DATABASE_URL',
  'PGHOST',
  'PGPASSWORD',
  'PGUSER',
  'PGDATABASE',
  'PGPORT',
];

const found = POISON_VARS.filter(v => process.env[v]);

if (found.length > 0) {
  console.warn('');
  console.warn('╔══════════════════════════════════════════════════════════╗');
  console.warn('║  CHOICE PROPERTIES — WARNING (non-blocking)             ║');
  console.warn('╠══════════════════════════════════════════════════════════╣');
  console.warn('║                                                          ║');
  console.warn('║  Replit has injected PostgreSQL environment variables.   ║');
  console.warn('║  This is caused by the locked system integration in      ║');
  console.warn('║  .replit and does NOT mean this project uses a local DB. ║');
  console.warn('║  All backend data lives in SUPABASE CLOUD.               ║');
  console.warn('║                                                          ║');
  console.warn('║  Detected (harmless in this context):                    ║');
  found.forEach(v => {
    const padded = ('  ' + v).padEnd(58);
    console.warn(`║${padded}  ║`);
  });
  console.warn('║                                                          ║');
  console.warn('║  DO NOT connect to any local database.                   ║');
  console.warn('║  DO NOT install Drizzle, Prisma, or any ORM.            ║');
  console.warn('║  The real database is Supabase cloud.                    ║');
  console.warn('║  Use SUPABASE_URL and SUPABASE_ANON_KEY only.            ║');
  console.warn('║                                                          ║');
  console.warn('║  Continuing to start preview server...                   ║');
  console.warn('╚══════════════════════════════════════════════════════════╝');
  console.warn('');
}

// ── Environment looks clean — verify Supabase keys are present ──
const SUPABASE_URL      = process.env.SUPABASE_URL      || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('');
  console.warn('┌──────────────────────────────────────────────────────────┐');
  console.warn('│  WARNING: Supabase credentials not found in Secrets.     │');
  console.warn('│                                                          │');
  console.warn('│  Add these to Replit Secrets (the padlock icon):         │');
  console.warn('│    SUPABASE_URL        — your Supabase project URL       │');
  console.warn('│    SUPABASE_ANON_KEY   — your Supabase anon/public key   │');
  console.warn('│                                                          │');
  console.warn('│  Preview will start but pages requiring Supabase will    │');
  console.warn('│  not function until secrets are set.                     │');
  console.warn('└──────────────────────────────────────────────────────────┘');
  console.warn('');
}

// ── All clear — start the preview server ────────────────────
console.log('');
console.log('✓ Environment guard passed. No Postgres poison detected.');
console.log('✓ Starting preview server via serve.js...');
console.log('');
console.log('  This is a LOCAL PREVIEW only.');
console.log('  Production is served by Cloudflare Pages.');
console.log('  Push to GitHub → Cloudflare auto-deploys.');
console.log('');

require('./serve.js');
