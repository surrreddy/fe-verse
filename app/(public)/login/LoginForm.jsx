'use client';

import React, { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // call server action passed from the server component
      await onLogin({ login, password });
      // on success, the server action redirects; no client code runs after redirect
    } catch (err) {
      // surface a clean error in the UI
      const msg = err?.message || 'Login failed';
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* login field */}
      <div>
        <label htmlFor="login" className="mb-1 block text-sm font-medium text-gray-800">
          Email or Phone
        </label>
        <input
          id="login"
          type="text"
          autoComplete="username"
          required
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className={[
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
          ].join(' ')}
          placeholder="jane@example.com or 9999999999"
        />
      </div>

      {/* password field */}
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-800">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={[
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
          ].join(' ')}
          placeholder="••••••••"
        />
      </div>

      {/* error + submit */}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
