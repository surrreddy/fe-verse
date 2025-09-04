// lib/schema/validate.js
import { computeActiveLeaves } from './branching';
import { acronym } from './keygen';

const v = {
  required: (val) => !(val === undefined || val === null || val === ''),
  maxLen: (val, n) => (typeof val === 'string' ? val.length <= n : true),
  num: (val) => (val === '' || val === undefined ? true : /^-?\d*\.?\d+$/.test(String(val))),
  min: (val, n) => (val === '' || val === undefined ? true : parseFloat(val) >= n),
  max: (val, n) => (val === '' || val === undefined ? true : parseFloat(val) <= n),
  email: (val) => (val ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) : true)
};

/** Validate a single field + value. Returns '' if OK, else error message. */
export function validateField(field, value) {
  if (field.required && !v.required(value)) return 'This field is required.';
  if ((field.type === 'text' || field.type === 'textarea') && field.charLimit) {
    if (!v.maxLen(value, parseInt(field.charLimit, 10))) return `Max ${field.charLimit} characters.`;
  }
  if (field.type === 'number') {
    if (!v.num(value)) return 'Please enter a valid number.';
    if (field.min && !v.min(value, parseFloat(field.min))) return `Minimum is ${field.min}.`;
    if (field.max && !v.max(value, parseFloat(field.max))) return `Maximum is ${field.max}.`;
  }
  if (field.type === 'text' && String(field.label || '').toLowerCase().includes('email')) {
    if (!v.email(value)) return 'Enter a valid email address.';
  }
  return '';
}

/**
 * Validate current values for a step (active leaves only).
 * @returns {object} errors map { flatKey: message }
 */
export function validateStep(stepSchema, values = {}, branchSelections = {}) {
  const rootAcr = acronym(stepSchema?.title || '');
  const active = computeActiveLeaves(stepSchema, branchSelections, [rootAcr]);
  const errors = {};
  active.forEach(({ key, field }) => {
    const msg = validateField(field, values[key]);
    if (msg) errors[key] = msg;
  });
  return errors;
}

/** Keep only active leaf keys in a payload when submitting. */
export function sanitizeToActive(stepSchema, values = {}, branchSelections = {}) {
  const rootAcr = acronym(stepSchema?.title || '');
  const active = computeActiveLeaves(stepSchema, branchSelections, [rootAcr]).map(a => a.key);
  const out = {};
  active.forEach(k => { if (k in values) out[k] = values[k]; });
  return out;
}
