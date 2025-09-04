import { cookies } from 'next/headers';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set`);
  return v;
}

export async function POST(request) {
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

  const form = await request.formData();
  const file = form.get('file');
  
  if (!(file instanceof Blob)) {
    return new Response(JSON.stringify({ error: 'No file' }), { status: 400 });
  }

  // Preserve original filename (keeps .pdf/.doc/.docx so backend validators pass)
  const fwd = new FormData();
  // keep the user's original name so backend can derive .pdf/.doc/.docx
  fwd.append('file', file, file.name || 'upload');

  const resp = await fetch(`${BACKEND_URL}/api/media/upload?fieldKey=${encodeURIComponent(fieldKey)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fwd
  });

  const buf = await resp.arrayBuffer();
  return new Response(buf, {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' }
  });
}
