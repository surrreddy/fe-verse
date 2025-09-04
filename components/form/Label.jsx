// components/form/Label.jsx
'use client';

export default function Label({ title, description = '', required = false }) {
  return (
    <div className="mb-1">
      <div className="text-sm font-medium text-gray-800">
        {title}{required ? <span className="text-red-600 ml-0.5">*</span> : null}
      </div>
      <div className="text-xs text-gray-500 min-h-[1rem]">{description || ' '}</div>
    </div>
  );
}
