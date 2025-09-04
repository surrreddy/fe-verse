// app/(public)/login/page.js
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoginForm from './LoginForm';
import { loginAction } from '@/lib/api/actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (token) redirect('/form');

  async function onLogin(payload) {
    'use server';
    await loginAction(payload);
    redirect('/form');
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your email or phone and password to continue.
        </p>
        <LoginForm onLogin={onLogin} />
        <div className="mt-4 text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link href="/register" className="text-blue-700 hover:underline">
            Create one
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
