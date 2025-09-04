'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import SectionCard from './chrome/SectionCard';
import ErrorList from './chrome/ErrorList';
import StepProgress from './chrome/StepProgress';
import TextInput from './fields/TextInput';
import TextArea from './fields/TextArea';
import Select from './fields/Select';
import Checkbox from './fields/Checkbox';
import MediaUploader from './fields/MediaUploader';
import { computeOverallProgress } from '@/lib/form/compute';
import { redirect } from 'next/navigation';

/* ---- key helpers (must match backend + lib/form/compute) ---- */
// IMPORTANT: shared key helpers (must match backend + lib/schema)
const acronym = (s) =>
  (s || '')
    .split(/[^A-Za-z]+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0].toUpperCase())
    .join('');

// PascalCase with NO underscores between words
const toPascal = (s) =>
  (s || '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');

// Non-branched leaf key
const makePlainLeafKey = (pathParts, label) =>
  [...pathParts, toPascal(label)].join('_');

// Parent enum column key (Pascal)
const makeParentKey = (pathParts, parentLabel) =>
  [...pathParts, toPascal(parentLabel)].join('_');

// NEW: Branched child leaf key includes selected option
const makeBranchedLeafKey = (pathParts, parentLabel, optionName, childLabel) =>
  [...pathParts, acronym(parentLabel), toPascal(optionName), toPascal(childLabel)].join('_');


/* ---- tiny validators ---- */
const validators = {
  required: (v) => !(v === undefined || v === null || v === ''),
  maxLen: (v, n) => (typeof v === 'string' ? v.length <= n : true),
  minNum: (v, n) => (v === '' || v === undefined ? true : parseFloat(v) >= n),
  maxNum: (v, n) => (v === '' || v === undefined ? true : parseFloat(v) <= n),
  email: (v) => (v ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : true),
  number: (v) => (v === '' || v === undefined ? true : /^-?\d*\.?\d*$/.test(String(v))),
};

/**
 * props:
 *  - stepSchema
 *  - initialValues (subset for this step)
 *  - actions: { save(partial), submit(full) }
 *  - readOnly?: boolean
 *  - nav?: { prevSlug, nextSlug }
 *  - formStructure: full schema array         ← for live progress
 *  - savedAll: savedData for entire form      ← for live progress
 */
export default function DynamicForm({
  stepSchema,
  initialValues = {},
  actions = {},
  readOnly = false,
  nav = {},
  formStructure = [],
  savedAll = {},
}) {
  const rootAcr = acronym(stepSchema?.title || 'Step');
  const [values, setValues] = useState({ ...initialValues });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('All changes saved');

  // infer parent enum from existing children on first mount
  useEffect(() => {
    const inferred = {};
    const walk = (node, pathParts) => {
      (node.fields || []).forEach((f) => {
        if (!f.branches) return;
        const parentKey = makeParentKey(pathParts, f.label);
        if (values[parentKey]) return;

        const chosen = Object.keys(f.branches || {}).find((opt) =>
          (f.branches[opt] || []).some((bf) => {
            const k = makeBranchedLeafKey(pathParts, f.label, opt, bf.label);
            return values[k] !== undefined && values[k] !== '';
          })
        );
        if (chosen) inferred[parentKey] = chosen;
      });
      (node.subGroups || []).forEach((sg) => walk(sg, [...pathParts, acronym(sg.title)]));
    };

    if (stepSchema) walk(stepSchema, [rootAcr]);
    if (Object.keys(inferred).length) setValues((p) => ({ ...p, ...inferred }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const validateField = useCallback((key, field, val) => {
    if (field.required && !validators.required(val)) return 'This field is required.';
    if (field.type === 'text' || field.type === 'textarea') {
      if (field.charLimit && !validators.maxLen(val, parseInt(field.charLimit, 10))) {
        return `Max ${field.charLimit} characters.`;
      }
    }
    if (field.type === 'number') {
      if (!validators.number(val)) return 'Please enter a valid number.';
      if (field.min && !validators.minNum(val, parseFloat(field.min))) return `Minimum is ${field.min}.`;
      if (field.max && !validators.maxNum(val, parseFloat(field.max))) return `Maximum is ${field.max}.`;
    }
    if (field.type === 'text' && field.label?.toLowerCase().includes('email')) {
      if (!validators.email(val)) return 'Enter a valid email address.';
    }
    return '';
  }, []);

  const onValueChange = useCallback(
    (key, field) => (val) => {
      setValues((prev) => ({ ...prev, [key]: val }));
      setErrors((prev) => ({ ...prev, [key]: validateField(key, field, val) }));
    },
    [validateField]
  );

  const onParentChange = useCallback(
    (parentKey, field) => (opt) => {
      setValues((prev) => {
        const next = { ...prev, [parentKey]: opt };
        // clear all branched children for all options
        Object.keys(field.branches || {}).forEach((optionName) => {
          (field.branches[optionName] || []).forEach((bf) => {
            const pathParts = parentKey.split('_').slice(0, -1);
            const childKey = makeBranchedLeafKey(pathParts, field.label, optionName, bf.label);
            delete next[childKey];
          });
        });
        return next;
      });
    },
    []
  );


  // autosave (debounced)
  const lastSavedRef = useRef(initialValues);
  useEffect(() => {
    const diff = {};
    for (const [k, v] of Object.entries(values)) {
      if (lastSavedRef.current[k] !== v) diff[k] = v;
    }
    if (!Object.keys(diff).length) return;
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        setSaveNotice('Saving…');
        await actions?.save?.(diff);
        lastSavedRef.current = { ...lastSavedRef.current, ...diff };
        setSaveNotice('All changes saved');
      } catch (e) {
        console.error('Autosave failed', e);
        setSaveNotice('Save failed – retry');
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [values, actions]);

  const fieldRegistry = useMemo(
    () => ({
      text: TextInput,
      textarea: TextArea,
      enum: Select,
      checkbox: Checkbox,
      media: MediaUploader,
      number: (props) => <TextInput {...props} type="number" />,
    }),
    []
  );

  const computeActiveTree = useCallback(
    (node, pathParts = []) => {
      const out = [];
      (node.fields || []).forEach((f) => {
        if (f.branches) {
          const parentKey = makeParentKey(pathParts, f.label);
          out.push({ type: 'branch-parent', field: f, parentKey, pathParts });
          const selected = values[parentKey] || '';
          if (selected && f.branches[selected]) {
            (f.branches[selected] || []).forEach((bf) =>
              out.push({
                type: 'leaf',
                key: makeBranchedLeafKey(pathParts, f.label, selected, bf.label),
                field: bf,
              })
            );
          }
        } else {
          out.push({ type: 'leaf', key: makePlainLeafKey(pathParts, f.label), field: f });
        }
      });
      (node.subGroups || []).forEach((sg) =>
        out.push({
          type: 'section',
          title: sg.title,
          children: computeActiveTree(sg, [...pathParts, acronym(sg.title)]),
        })
      );
      return out;
    },
    [values]
  );

  const activeTree = useMemo(() => computeActiveTree(stepSchema, [rootAcr]), [computeActiveTree, stepSchema, rootAcr]);

  // -------- live progress (client-side, optimistic) --------
  const optimisticSaved = useMemo(() => ({ ...(savedAll || {}), ...values }), [savedAll, values]);
  const percent = useMemo(
    () => computeOverallProgress(formStructure || [], optimisticSaved),
    [formStructure, optimisticSaved]
  );

  const renderLeaf = (leaf) => {
    const { key, field } = leaf;
    const common = {
      id: key,                // used by MediaUploader as fieldKey fallback
      fieldKey: key,          // explicit for media upload
      value: values[key],
      onChange: onValueChange(key, field),
      disabled: readOnly,
    };
    const withLabel = (
      <>
        <div className="text-sm font-medium text-gray-800">
          {field.label}
          {field.required ? <span className="text-red-600 ml-0.5">*</span> : null}
        </div>
        <div className="text-xs text-gray-500 min-h-[1rem]">{field.description || ' '}</div>
      </>
    );

    switch (field.type) {
      case 'text':
        return (
          <div>
            {withLabel}
            <TextInput {...common} maxLength={parseInt(field.charLimit, 10) || undefined} />
          </div>
        );
      case 'textarea':
        return (
          <div>
            {withLabel}
            <TextArea {...common} rows={5} maxLength={parseInt(field.charLimit, 10) || undefined} />
          </div>
        );
      case 'enum':
        return (
          <div>
            {withLabel}
            <Select {...common} options={field.options || []} />
          </div>
        );
      case 'checkbox':
        return (
          <div>
            {withLabel}
            <Checkbox checked={!!values[key]} onChange={onValueChange(key, field)} disabled={readOnly} />
          </div>
        );
      case 'media':
        return (
          <div>
            {withLabel}
            <MediaUploader
              {...common}
              mediaType={String(field.mediaType || 'PDF').toUpperCase()}
              sizeLimitMB={parseInt(field.maxSize, 10) || 12}
            />
          </div>
        );
      case 'number':
        return (
          <div>
            {withLabel}
            <TextInput {...common} type="number" />
          </div>
        );
      default:
        return (
          <div>
            {withLabel}
            <TextInput {...common} />
          </div>
        );
    }
  };

  const renderBranchParent = ({ field, parentKey }) => {
    const withLabel = (
      <>
        <div className="text-sm font-medium text-gray-800">
          {field.label}
          {field.required ? <span className="text-red-600 ml-0.5">*</span> : null}
        </div>
        <div className="text-xs text-gray-500 min-h-[1rem]">{field.description || ' '}</div>
      </>
    );
    return (
      <div>
        {withLabel}
        <Select
          value={values[parentKey] || ''}
          onChange={onParentChange(parentKey, field)}
          options={field.options || []}
          disabled={readOnly}
        />
      </div>
    );
  };

  const renderTree = (nodes, inSection = false) =>
    nodes.map((n, idx) => {
      if (n.type === 'section') {
        return (
          <div key={`sec-${idx}`} className="col-span-2">
            <SectionCard title={n.title}>
              <div className="w-full flex flex-col gap-6">{renderTree(n.children || [], true)}</div>
            </SectionCard>
          </div>
        );
      }
      if (n.type === 'branch-parent') {
        return (
          <div key={`bp-${n.parentKey}`} className={inSection ? '' : 'col-span-2'}>
            {renderBranchParent(n)}
          </div>
        );
      }
      return (
        <div key={n.key} className={inSection ? 'w-full min-w-0' : ''}>
          {renderLeaf(n)}
        </div>
      );
    });

  const visibleErrors = useMemo(
    () => Object.fromEntries(Object.entries(errors).filter(([, v]) => v && String(v).trim() !== '')),
    [errors]
  );

  const onSubmit = async () => {
    redirect('/form/review'); // redirect to review page
  };

  return (
    <div className="flex flex-col gap-6">
      {/* live progress */}
      <StepProgress
        steps={(formStructure || []).map((rg) => ({
          slug: (rg.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          title: rg.title,
        }))}
        currentSlug={(stepSchema?.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
        percent={percent}
      />

      <SectionCard title={stepSchema?.title}>
        <div className="grid grid-cols-2 gap-6">{renderTree(activeTree, false)}</div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <span className="text-xs text-gray-500">{saveNotice}</span>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSaving(true);
                    setSaveNotice('Saving…');
                    await actions?.save?.(values);
                    setSaveNotice('All changes saved');
                  } catch (e) {
                    console.error('Save failed', e);
                    setSaveNotice('Save failed – retry');
                  } finally {
                    setSaving(false);
                  }
                }}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-blue-600 hover:text-blue-700"
              >
                Save
              </button>
              {nav.prevSlug && (
                <a
                  href={`/form/${nav.prevSlug}`}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-blue-600 hover:text-blue-700"
                >
                  Back
                </a>
              )}
              <button
                type="button"
                onClick={onSubmit}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Review &amp; Submit
              </button>
              {nav.nextSlug && (
                <a
                  href={`/form/${nav.nextSlug}`}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:border-blue-600 hover:text-blue-700"
                >
                  Next
                </a>
              )}
            </>
          )}
        </div>
      </SectionCard>

      <ErrorList errors={visibleErrors} />
    </div>
  );
}
