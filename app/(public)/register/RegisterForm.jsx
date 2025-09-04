'use client';

import React, { useState } from 'react';

export default function RegisterForm({ onRegister }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // simple client-side checks (backend remains authoritative)
    if (!name || !phone || !email || !password) {
      setError('All fields are required.');
      return;
    }
    // keep only digits in phone for UX (backend accepts as provided)
    const cleanPhone = phone.replace(/\D+/g, '');

    setSubmitting(true);
    try {
      await onRegister({ name, phone: cleanPhone, email, password });
      // success path: server action redirects; no code runs after
    } catch (err) {
      const msg = err?.message || 'Registration failed';
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-800">
          Full name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={[
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
          ].join(' ')}
          placeholder="Jane Doe"
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-800">
          Phone
        </label>
        <input
          id="phone"
          type="text"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={[
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
          ].join(' ')}
          placeholder="9999999999"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-800">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={[
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
          ].join(' ')}
          placeholder="jane@example.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-800">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={[
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
          ].join(' ')}
          placeholder="••••••••"
          required
        />
      </div>

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
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </div>
    </form>
  );
}
