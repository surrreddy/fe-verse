// components/form/SubmitFinal.jsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

/**
 * Props:
 *  - action: server action returning { ok, code?, errors?, submittedAt? }
 *  - eligible: boolean
 *  - disabled: boolean (if already submitted)
 */
function ButtonInner({ eligible }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!eligible || pending}
      className={`text-sm px-4 py-2 rounded-md border ${
        eligible && !pending
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
          : 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
      }`}
      title={eligible ? 'Submit application' : 'Complete all required fields to submit'}
    >
      {pending ? 'Submitting…' : 'Submit Application'}
    </button>
  );
}

export default function SubmitFinal({ action, eligible, disabled }) {
  // Initial state: nothing submitted yet
  const [state, formAction] = useActionState(action, { ok: null });

  const hasErrors = state && state.ok === false && state.code === 'VALIDATION';
  const errorMap = hasErrors ? state.errors || {} : {};

  return (
    <div className="space-y-3">
      {hasErrors && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium mb-1">Please fix the following before you can submit:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {Object.entries(errorMap).map(([k, v]) => (
              <li key={k}>
                <span className="font-mono text-xs bg-red-100 px-1 py-0.5 rounded">{k}</span>{' '}
                <span className="ml-1">{String(v)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={formAction}>
        <ButtonInner eligible={eligible && !disabled} />
      </form>
    </div>
  );
}
