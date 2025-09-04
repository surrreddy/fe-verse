// lib/cookies.js
'use server';

import { cookies } from 'next/headers';

const TWO_HOURS = 60 * 60 * 2;

export async function setAuthToken(token) {
  const jar = await cookies();
  jar.set('auth', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: TWO_HOURS
  });
}

export async function clearAuthToken() {
  const jar = await cookies();
  jar.delete('auth');
}
