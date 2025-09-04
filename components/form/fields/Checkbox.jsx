'use client';

import FieldLabel from './FieldLabel';

export default function Checkbox({
  checked = false,
  onChange,
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
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className={`h-4 w-4 rounded border-gray-300
          ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'}
          focus:ring-blue-600`}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : <p className="mt-1 text-xs">&nbsp;</p>}
    </div>
  );
}
