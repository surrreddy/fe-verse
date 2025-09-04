// app/(app)/form/[step]/page.js
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { beFetch } from '@/lib/api/client';
import { requireEnv } from '@/lib/env';
import { slugify, acronym } from '@/lib/form/compute';
import DynamicForm from '@/components/form/DynamicForm';

export const dynamic = 'force-dynamic';

export default async function StepPage({ params }) {
  // In your setup this resolved the Next warning:
  const { step } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) redirect('/login');

  const FORM_ID = requireEnv('FORM_ID');

  const res = await beFetch(`/api/forms/${FORM_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) redirect('/login');

  const { formStructure, savedData } = await res.json();

  // steps + current
  const steps = (formStructure || []).map((rg) => ({
    title: rg.title,
    slug: slugify(rg.title),
    rootAcr: acronym(rg.title),
  }));
  const current = steps.find((s) => s.slug === step);
  if (!current) {
    const fallback = steps[0]?.slug || 'personal-details';
    redirect(`/form/${fallback}`);
  }

  const stepSchema =
    (formStructure || []).find((rg) => slugify(rg.title) === step) || formStructure?.[0];

  // initial values for this step only
  const initialValues = {};
  for (const [k, v] of Object.entries(savedData || {})) {
    if (k.startsWith(`${current.rootAcr}_`)) initialValues[k] = v;
  }

  // server actions
  async function save(partial) {
    'use server';
    const jar = await cookies();
    const token2 = jar.get('auth')?.value;
    const r = await beFetch('/api/form/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token2 ? { Authorization: `Bearer ${token2}` } : {}),
      },
      body: JSON.stringify(partial),
      cache: 'no-store',
    });
    if (!r.ok) {
      const msg = await r.text();
      throw new Error(`Save failed: ${msg || r.status}`);
    }
    return true;
  }

  async function submit(full) {
    'use server';
    const jar = await cookies();
    const token2 = jar.get('auth')?.value;

    if (full && Object.keys(full).length) {
      const r1 = await beFetch('/api/form/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token2 ? { Authorization: `Bearer ${token2}` } : {}),
        },
        body: JSON.stringify(full),
        cache: 'no-store',
      });
      if (!r1.ok) {
        const m = await r1.text();
        throw new Error(`Save failed: ${m || r1.status}`);
      }
    }

    const r2 = await beFetch('/api/form/submit', {
      method: 'POST',
      headers: { ...(token2 ? { Authorization: `Bearer ${token2}` } : {}) },
      cache: 'no-store',
    });
    if (!r2.ok) {
      const m = await r2.text();
      throw new Error(`Submit failed: ${m || r2.status}`);
    }
    redirect('/review');
  }

  const idx = steps.findIndex((s) => s.slug === step);
  const prevSlug = idx > 0 ? steps[idx - 1].slug : null;
  const nextSlug = idx < steps.length - 1 ? steps[idx + 1].slug : null;

  return (
    <div className="flex flex-col gap-6">
      <DynamicForm
        stepSchema={stepSchema}
        initialValues={initialValues}
        actions={{ save, submit }}
        readOnly={false}
        nav={{ prevSlug, nextSlug }}
        formStructure={formStructure}
        savedAll={savedData}
      />
    </div>
  );
}
