// lib/api/actions.js
'use server';

import { beFetch } from './client';
import { setAuthToken, clearAuthToken } from '../cookies';

/** Signup returns token and sets cookie */
export async function signupAction({ name, phone, email, password }) {
  const res = await beFetch('/api/users/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, password })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Signup failed: ${text}`);
  }

  const { token } = await res.json();
  await setAuthToken(token);
  return { ok: true };
}

/** Login returns token and sets cookie */
export async function loginAction({ login, password }) {
  const res = await beFetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed: ${text}`);
  }

  const { token } = await res.json();
  await setAuthToken(token);
  return { ok: true };
}

/** Logout clears cookie */
export async function logoutAction() {
  await clearAuthToken();
  return { ok: true };
}

/** Save partial data (draft). */
export async function saveAction(partial) {
  const res = await beFetch('/api/form/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial || {})
  });

  if (res.status === 204) return { ok: true };
  if (res.status === 403) return { ok: false, code: 'LOCKED' };

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Save failed: ${text}`);
  }
  return { ok: true };
}

/**
 * Final submission (irreversible).
 * Returns:
 *   - { ok:true, submittedAt }
 *   - { ok:false, code:'ALREADY' }
 *   - { ok:false, code:'VALIDATION', errors:{...} }
 *   - { ok:false, code:'ERROR', message:string }
 */
export async function submitAction() {
  const res = await beFetch('/api/form/submit', { method: 'POST' });

  if (res.ok) {
    const json = await res.json();
    return { ok: true, submittedAt: json.submittedAt || null };
  }

  if (res.status === 409) {
    return { ok: false, code: 'ALREADY' };
  }

  if (res.status === 400) {
    let body = {};
    try { body = await res.json(); } catch {}
    const errors = body.errors || body || {};
    return { ok: false, code: 'VALIDATION', errors };
  }

  const text = await res.text();
  return { ok: false, code: 'ERROR', message: text || 'Submit failed' };
}
