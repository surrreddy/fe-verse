'use client';

import FieldLabel from './FieldLabel';

export default function TextArea({
  value = '',
  onChange,
  rows = 5,
  maxLength,
  disabled = false,
  label,
  hint,
  required = false,
  error = '',
}) {
  const count = typeof value === 'string' ? value.length : String(value || '').length;
  return (
    <div className="w-full">
      {label && (
        <FieldLabel required={required} hint={hint}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none shadow-sm resize-vertical
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${error ? 'border-red-400' : 'border-gray-300'}
            focus:ring-1 focus:ring-blue-600`}
        />
        {maxLength ? (
          <span className="pointer-events-none absolute right-2 top-2 text-xs text-gray-400">
            {count}/{maxLength}
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : <p className="mt-1 text-xs">&nbsp;</p>}
    </div>
  );
}
