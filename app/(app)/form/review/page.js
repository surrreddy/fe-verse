// app/(app)/form/review/page.js
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireEnv } from '@/lib/env';
import { beFetch } from '@/lib/api/client';
import { submitAction as doSubmit } from '@/lib/api/actions';
import { computeOverallProgress, acronym, toPascal, slugify } from '@/lib/form/compute';
import SubmitFinal from '@/components/form/SubmitFinal';

export const dynamic = 'force-dynamic';

async function fetchSchemaAndData() {
  const FORM_ID = requireEnv('FORM_ID');
  const res = await beFetch(`/api/forms/${FORM_ID}`, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch schema: ${text}`);
  }
  return res.json(); // { formStructure, savedData, meta }
}

// Render a simple read-only summary grouped by sections/subgroups
function Summary({ formStructure, savedData }) {
  const readVal = (key) => {
    const v = savedData[key];
    if (v === undefined || v === null || v === '') return <span className="text-gray-400">—</span>;
    return String(v);
  };

  const renderFields = (fields, pathParts = []) => (
    <div className="space-y-4">
      {fields.map((f, idx) => {
        const parentKey = [...pathParts, toPascal(f.label)].join('_');
        if (f.branches) {
          const choice = savedData[parentKey];
          const children = (f.branches?.[choice] || []);
          return (
            <div key={`${parentKey}-${idx}`} className="space-y-2">
              <div className="text-sm text-gray-600">{f.label}</div>
              <div className="text-sm font-medium">{readVal(parentKey)}</div>
              {children.length > 0 && (
                <div className="pl-4 border-l border-gray-200 space-y-2">
                  {children.map((bf, j) => {
                    const childKey = [
                      ...pathParts,
                      acronym(f.label),
                      toPascal(choice || ''),
                      toPascal(bf.label),
                    ].join('_');
                    return (
                      <div key={`${childKey}-${j}`}>
                        <div className="text-sm text-gray-600">{bf.label}</div>
                        <div className="text-sm font-medium">{readVal(childKey)}</div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        }
        return (
          <div key={`${parentKey}-${idx}`}>
            <div className="text-sm text-gray-600">{f.label}</div>
            <div className="text-sm font-medium">{readVal(parentKey)}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8">
      {(formStructure || []).map((rg, i) => (
        <div key={`rg-${i}`} className="rounded-xl border p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{rg.title}</h2>

          {(rg.fields && rg.fields.length > 0) && (
            <div className="grid grid-cols-1 gap-6">
              {renderFields(rg.fields, [acronym(rg.title)])}
            </div>
          )}

          {(rg.subGroups && rg.subGroups.length > 0) && (
            <div className="space-y-6">
              {rg.subGroups.map((sg, j) => (
                <div key={`sg-${i}-${j}`} className="rounded-lg border p-4 bg-gray-50">
                  <h3 className="text-base font-semibold mb-3">{sg.title}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {renderFields(sg.fields || [], [acronym(rg.title), acronym(sg.title)])}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function ReviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) redirect('/login');

  const { formStructure, savedData, meta } = await fetchSchemaAndData();
  const progress = computeOverallProgress(formStructure, savedData);
  const eligible = progress === 100 && !meta?.isSubmitted;

  // Server action (returns structured result instead of throwing)
  async function submitAction() {
    'use server';
    const result = await doSubmit();

    if (result.ok) {
      // reflect submitted state
      redirect('/form/review');
    }

    if (result.code === 'ALREADY') {
      redirect('/form/review');
    }

    // return object -> handled by <SubmitFinal /> with useActionState
    return result;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{!meta?.isSubmitted ? 'Review & Submit' : `Application preview`}</h1>
        <div className="text-sm text-gray-600">
          Progress: <span className="font-medium">{progress}%</span>
          {meta?.isSubmitted && (
            <span className="ml-3 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Submitted {meta.submittedAt ? new Date(meta.submittedAt).toLocaleString() : ''}
            </span>
          )}
        </div>
      </div>

      {!meta?.isSubmitted ? (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          <p className="font-medium">Submitting is final.</p>
          <p className="mt-1">
            You won’t be able to edit your application after submission.
            Administrators can only review applications that have been submitted.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
          <p className="font-medium">Your application was submitted.</p>
          <p className="mt-1">You can download uploaded files but cannot edit any fields.</p>
        </div>
      )}

      <Summary formStructure={formStructure} savedData={savedData} />

      <div className="flex items-center justify-end gap-3 pt-2">
        {!meta?.isSubmitted ? (
          <>
            <Link href="/form" className="text-sm px-3 py-2 rounded-md border hover:bg-gray-50">
              Back to form
            </Link>
            <SubmitFinal action={submitAction} eligible={eligible} disabled={!!meta?.isSubmitted} />
          </>
        ) : (
          <Link href="/form" className="text-sm px-3 py-2 rounded-md border hover:bg-gray-50">
            View form (read-only)
          </Link>
        )}
      </div>
    </div>
  );
}
