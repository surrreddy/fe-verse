import { cookies } from 'next/headers';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set`);
  return v;
}

export async function DELETE(request) {
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

  const resp = await fetch(`${BACKEND_URL}/api/media?fieldKey=${encodeURIComponent(fieldKey)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (resp.status === 204) return new Response(null, { status: 204 });

  const buf = await resp.arrayBuffer();
  return new Response(buf, {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' }
  });
}
