// lib/form/compute.js
// Shared helpers + branch-aware progress

export function acronym(s = '') {
  return s
    .split(/[^A-Za-z]+/)
    .filter(w => /^[A-Za-z]/.test(w))
    .map(w => w[0].toUpperCase())
    .join('');
}

export function toPascal(s = '') {
  return s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join('');
}

export function slugify(s = '') {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Build the wizard steps from the root groups of the schema.
 * Returns [{ title, slug, rootAcr }]
 */
export function deriveSteps(formStructure = []) {
  return (formStructure || []).map(rg => {
    const title = rg.title || '';
    return {
      title,
      slug: slugify(title),
      rootAcr: acronym(title),
    };
  });
}

/**
 * Keep only values belonging to one step (prefix match on root acronym).
 * Example: rootAcr='PD' keeps keys 'PD_*'
 */
export function filterSavedForStep(savedData = {}, rootAcr = '') {
  const out = {};
  const prefix = rootAcr ? `${rootAcr}_` : '';
  for (const [k, v] of Object.entries(savedData || {})) {
    if (!prefix || k === rootAcr || k.startsWith(prefix)) {
      out[k] = v;
    }
  }
  return out;
}

const isFilled = v => {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  return v !== '';
};

/**
 * Branch-aware progress calculator:
 * - Counts required non-branch leaves
 * - Counts required parent-enums
 * - For the selected option only, counts required child leaves (incl. media)
 */
export function computeOverallProgress(formStructure, savedData = {}) {
  let required = 0;
  let filled = 0;

  const walk = (node, pathParts = []) => {
    (node.fields || []).forEach((f) => {
      // parent key stays Pascal(label) on the current path
      const parentKey = [...pathParts, toPascal(f.label)].join('_');

      if (f.branches) {
        if (f.required) {
          required += 1;
          if (isFilled(savedData[parentKey])) filled += 1;
        }

        const choice = savedData[parentKey];
        const children = (f.branches?.[choice] || []);
        children.forEach((bf) => {
          if (bf.required) {
            // NEW: include the selected option in the child key
            const childKey = [
              ...pathParts,
              acronym(f.label),
              toPascal(choice || ''),
              toPascal(bf.label),
            ].join('_');
            required += 1;
            if (isFilled(savedData[childKey])) filled += 1;
          }
        });
      } else {
        if (f.required) {
          required += 1;
          if (isFilled(savedData[parentKey])) filled += 1;
        }
      }
    });

    (node.subGroups || []).forEach((sg) => {
      walk(sg, [...pathParts, acronym(sg.title)]);
    });
  };

  (formStructure || []).forEach((rg) => walk(rg, [acronym(rg.title)]));

  if (required === 0) return 0;
  return Math.round((filled / required) * 100);
}
