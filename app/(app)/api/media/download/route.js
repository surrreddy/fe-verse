import { cookies } from 'next/headers';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set`);
  return v;
}

export async function GET(request) {
  const BACKEND_URL = requireEnv('BACKEND_URL');
  const url = new URL(request.url);
  const fieldKey = url.searchParams.get('fieldKey');
  if (!fieldKey) {
    return new Response(JSON.stringify({ error: 'fieldKey is required' }), { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get('auth')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const resp = await fetch(`${BACKEND_URL}/api/media/download?fieldKey=${encodeURIComponent(fieldKey)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  const buf = await resp.arrayBuffer();
  const headers = new Headers();
  const ct = resp.headers.get('Content-Type') || 'application/octet-stream';
  const cd = resp.headers.get('Content-Disposition');
  headers.set('Content-Type', ct);
  if (cd) headers.set('Content-Disposition', cd);

  return new Response(buf, { status: resp.status, headers });
}
