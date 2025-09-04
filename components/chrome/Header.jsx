// components/chrome/Header.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/lib/api/actions';

export default function Header({ appname, isSubmitted = false }) {
  const pathname = usePathname() || '/';

  const onReview = pathname.startsWith('/form/review');
  const onForm = pathname.startsWith('/form') && !onReview;

  const base = 'text-sm px-1.5 py-0.5 rounded-sm transition-colors';
  const active = 'font-semibold text-gray-900';
  const inactive = 'text-gray-600 hover:text-blue-700';

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          {!isSubmitted ? (
            <>
              <Link
                href="/form"
                aria-current={onForm ? 'page' : undefined}
                className={`${base} ${onForm ? active : inactive}`}
              >
                {appname}
              </Link>
              <Link
                href="/form/review"
                aria-current={onReview ? 'page' : undefined}
                className={`${base} ${onReview ? active : inactive}`}
              >
                Review &amp; Submit
              </Link>
            </>
          ) : (
            <span className={`${base} ${active}`}>Application Submitted</span>
          )}
        </nav>

        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-blue-600 hover:text-blue-700"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
