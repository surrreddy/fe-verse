// lib/api/client.js
import 'server-only';
import { cookies } from 'next/headers';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set in server env`);
  return v;
}

export async function beFetch(path, init = {}) {
  const BACKEND_URL = requireEnv('BACKEND_URL');
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value || '';

  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  if (init.body && typeof init.body !== 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers,
    body: typeof init.body === 'string' ? init.body : init.body ? JSON.stringify(init.body) : undefined,
  });

  return res;
}

export async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
export async function safeText(res) {
  try { return await res.text(); } catch { return ''; }
}
