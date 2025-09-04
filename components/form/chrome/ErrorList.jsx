'use client';
import React from 'react';

export default function ErrorList({ errors = {} }) {
  const entries = Object.entries(errors).filter(([, v]) => v && String(v).trim() !== '');
  if (!entries.length) return null;

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3">
      <ul className="list-disc pl-5 text-sm text-red-700">
        {entries.map(([k, v]) => (
          <li key={k}>
            <span className="font-medium">{k}:</span> {String(v)}
          </li>
        ))}
      </ul>
    </div>
  );
}
