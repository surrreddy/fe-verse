// app/(app)/form/page.js
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { beFetch } from '@/lib/api/client';
import { requireEnv } from '@/lib/env';
import { slugify } from '@/lib/form/compute';

export const dynamic = 'force-dynamic';

export default async function FormIndexPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) redirect('/login');

  const FORM_ID = requireEnv('FORM_ID');
  const res = await beFetch(`/api/forms/${FORM_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    // If schema can’t be fetched, push to login to re-auth
    redirect('/login');
  }

  const { formStructure, meta } = await res.json();

  // If submitted, never send user to editing flow; land in read-only review.
  if (meta?.isSubmitted) {
    redirect('/form/review');
  }

  const first = (formStructure?.[0]?.title) || 'Personal Details';
  const firstSlug = slugify(first);

  redirect(`/form/${firstSlug}`);
}
