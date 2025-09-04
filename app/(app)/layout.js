// app/(app)/layout.js
import Header from '@/components/chrome/Header';
import { cookies } from 'next/headers';
import { beFetch } from '@/lib/api/client';
import { requireEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

// IMPORTANT: No <html> or <body> here. Only the app shell.
export default async function AppShellLayout({ children }) {
  // Determine if the current user has already submitted
  let isSubmitted = false;
  try {
    const jar = await cookies();
    const token = jar.get('auth')?.value;
    if (token) {
      const FORM_ID = requireEnv('FORM_ID');
      const res = await beFetch(`/api/forms/${FORM_ID}`, { cache: 'no-store' });
      if (res.ok) {
        const { meta } = await res.json();
        isSubmitted = !!meta?.isSubmitted;
      }
    }
  } catch {
    // Swallow errors; default isSubmitted=false keeps prior behavior.
  }

  const appname = process.env.APP_DISPLAY_NAME.replace(/_/g, ' ') || 'Application';
  console.log(`App name: ${appname}, isSubmitted: ${isSubmitted}`);

  return (
    <>
      <Header isSubmitted={isSubmitted} appname = {appname}/>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </>
  );
}
