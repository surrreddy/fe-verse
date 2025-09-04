// app/(public)/register/page.js
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RegisterForm from './RegisterForm';
import { signupAction } from '@/lib/api/actions';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (token) redirect('/form');

  async function onRegister(payload) {
    'use server';
    await signupAction(payload);
    redirect('/form');
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Create your account</h1>
        <p className="mb-6 text-sm text-gray-600">
          Sign up with your name, phone, email, and a password.
        </p>
        <RegisterForm onRegister={onRegister} />
        <div className="mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-700 hover:underline">
            Sign in
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
