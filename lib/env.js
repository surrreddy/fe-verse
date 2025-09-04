// lib/env.js
// Small helper to read required env vars with clear errors

export function requireEnv(name) {
  const v = process.env[name];
  if (v === undefined || v === null || v === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}
