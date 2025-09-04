// components/form/chrome/LiveProgress.jsx
'use client';

import { useEffect, useState } from 'react';
import StepProgress from './StepProgress';

export default function LiveProgress({ steps = [], currentSlug, initialPercent = 0 }) {
  const [percent, setPercent] = useState(
    Math.max(0, Math.min(100, Number.isFinite(initialPercent) ? initialPercent : 0))
  );

  useEffect(() => {
    const handler = (e) => {
      const p = e?.detail;
      if (typeof p === 'number' && Number.isFinite(p)) {
        setPercent(Math.max(0, Math.min(100, Math.round(p))));
      }
    };
    window.addEventListener('form:progress', handler);
    return () => window.removeEventListener('form:progress', handler);
  }, []);

  return <StepProgress steps={steps} currentSlug={currentSlug} percent={percent} />;
}
