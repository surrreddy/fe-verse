// lib/schema/keygen.js

/** First letters of alphabetic words, uppercase (e.g., "10th Standard" -> "TS") */
export function acronym(s = '') {
  return s
    .split(/[^A-Za-z]+/)
    .filter(w => /^[A-Za-z]/.test(w))
    .map(w => w[0].toUpperCase())
    .join('');
}

/** PascalCase letters/digits-only (e.g., "Percentage Secured" -> "PercentageSecured") */
export function toPascal(s = '') {
  return s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join('');
}

/** Create a leaf key from a path of acronyms + leaf label (PascalCase). */
export function makeLeafKey(parts = [], label = '') {
  return [...parts, toPascal(label)].join('_');
}

/** Slug for route segments (root-group titles to [step]). */
export function slugify(s = '') {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Generate all flat keys for a single root-group schema node.
 * @param {object} node - { title, fields, subGroups }
 * @param {string[]} pathParts - e.g. [acronym(root.title)]
 * @returns {string[]} leaf keys
 */
export function deriveLeafKeysForNode(node, pathParts = []) {
  const out = [];
  (node.fields || []).forEach(f => {
    if (f.branches) {
      // include all possible child leaves across options (static set)
      for (const opt in (f.branches || {})) {
        (f.branches[opt] || []).forEach(bf => {
          out.push(makeBranchedLeafKey(pathParts, f.label, opt, bf.label));
        });
      }
    } else {
      out.push(makeLeafKey(pathParts, f.label));
    }
  });
  (node.subGroups || []).forEach(sg => {
    out.push(...deriveLeafKeysForNode(sg, [...pathParts, acronym(sg.title)]));
  });
  return out;
}


/** All keys across the full form structure. */
export function deriveAllLeafKeys(structure = []) {
  const keys = [];
  (structure || []).forEach(rg => {
    keys.push(...deriveLeafKeysForNode(rg, [acronym(rg.title)]));
  });
  return keys;
}

/** Branched child key: includes the selected option token. */
export function makeBranchedLeafKey(parts = [], parentLabel = '', optionName = '', childLabel = '') {
  return [...parts, acronym(parentLabel), toPascal(optionName), toPascal(childLabel)].join('_');
}
