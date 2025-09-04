'use client';

import FieldLabel from './FieldLabel';

export default function Select({
  value = '',
  onChange,
  options = [],
  disabled = false,
  label,
  hint,
  required = false,
  error = '',
}) {
  return (
    <div className="w-full">
      {label && (
        <FieldLabel required={required} hint={hint}>
          {label}
        </FieldLabel>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none shadow-sm
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${error ? 'border-red-400' : 'border-gray-300'}
          focus:ring-1 focus:ring-blue-600`}
      >
        <option value="" disabled>
          -- Select --
        </option>
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {String(opt)}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : <p className="mt-1 text-xs">&nbsp;</p>}
    </div>
  );
}
