// components/form/chrome/StepProgress.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { computeOverallProgress } from '@/lib/form/compute';

/**
 * Props:
 * - steps: [{ title, slug }]
 * - currentSlug: string
 * - percent?: number                 ← if provided, use this directly
 * - formStructure?: array            ← fallback compute mode
 * - initialSavedData?: object        ← fallback compute mode
 */
export default function StepProgress({
  steps = [],
  currentSlug,
  percent,                 // optional override
  formStructure = [],
  initialSavedData = {},
}) {
  // Fallback compute mode state
  const [data, setData] = useState(() => ({ ...initialSavedData }));

  const computed = useMemo(
    () => computeOverallProgress(formStructure, data),
    [formStructure, data]
  );

  // If percent is provided, we ignore patch events & computed value
  useEffect(() => {
    if (Number.isFinite(percent)) return; // no-op in override mode
    function onPatch(e) {
      const { set = {}, clear = [] } = e.detail || {};
      setData((prev) => {
        const next = { ...prev };
        clear.forEach((k) => {
          if (k in next) delete next[k];
        });
        Object.entries(set).forEach(([k, v]) => {
          next[k] = v === undefined || v === null ? '' : v;
        });
        return next;
      });
    }
    window.addEventListener('form:patch', onPatch);
    return () => window.removeEventListener('form:patch', onPatch);
  }, [percent]);

  const finalPercent = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, Math.round(percent)))
    : Math.max(0, Math.min(100, Math.round(computed)));

  return (
    <div className="mb-4">
      <div className="flex items-center gap-4 mb-2">
        {steps.map((s, i) => {
          const active = s.slug === currentSlug;
          return (
            <a
              key={s.slug}
              href={`/form/${s.slug}`}
              className={`flex items-center gap-2 text-sm ${
                active ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                  active
                    ? 'border-blue-700 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-600'
                }`}
              >
                {i + 1}
              </span>
              <span>{s.title}</span>
            </a>
          );
        })}
        <div className="ml-auto text-sm text-gray-600">{finalPercent}%</div>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{ width: `${finalPercent}%` }}
        />
      </div>
    </div>
  );
}
