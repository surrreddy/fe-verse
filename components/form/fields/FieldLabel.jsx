'use client';
import React from 'react';

export default function FieldLabel({ htmlFor, children, required = false, hint }) {
  const hasHint = typeof hint === 'string' && hint.trim().length > 0;

  return (
    <div className="mb-1">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-800"
      >
        {children}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>

      {/* Keep vertical rhythm: show a blank line if no hint provided */}
      {hasHint ? (
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      ) : (
        <p className="text-xs mt-0.5">&nbsp;</p>
      )}
    </div>
  );
}
