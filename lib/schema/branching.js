// lib/schema/branching.js
import { acronym, makeLeafKey, makeBranchedLeafKey } from './keygen';


/**
 * Infer current branch selections by checking which branch children have values.
 * @param {object} stepSchema - root-group schema
 * @param {object} values - flat key -> value (subset for step)
 * @param {string[]} pathParts - e.g. [acronym(root.title)]
 * @returns {object} map of parentKey (acronym path + acronym(parentLabel)) -> selectedOption
 */
export function inferBranchSelections(stepSchema, values = {}, pathParts = []) {
  const inferred = {};

  const walk = (node, parts) => {
    (node.fields || []).forEach(f => {
      if (f.branches) {
        // ephemeral parent key used only within this module
        const parentKey = [...parts, acronym(f.label)].join('_');

        const matchOpt = Object.keys(f.branches || {}).find(opt =>
          (f.branches[opt] || []).some(bf => {
            const childKey = makeBranchedLeafKey(parts, f.label, opt, bf.label);
            const v = values[childKey];
            return v !== undefined && v !== '';
          })
        );

        if (matchOpt) inferred[parentKey] = matchOpt;
      }
    });
    (node.subGroups || []).forEach(sg => walk(sg, [...parts, acronym(sg.title)]));
  };

  walk(stepSchema, pathParts);
  return inferred;
}


/**
 * Compute active leaves (only the currently selected branches) for a step.
 * Returns a simple flat list of { key, field } leaves.
 */
export function computeActiveLeaves(stepSchema, branchSelections = {}, pathParts = []) {
  const leaves = [];

  const walk = (node, parts) => {
    (node.fields || []).forEach(f => {
      if (f.branches) {
        const parentKey = [...parts, acronym(f.label)].join('_');
        const sel = branchSelections[parentKey];
        if (sel && f.branches[sel]) {
          (f.branches[sel] || []).forEach(bf => {
            leaves.push({
              key: makeBranchedLeafKey(parts, f.label, sel, bf.label),
              field: bf,
            });
          });
        }
      } else {
        leaves.push({ key: makeLeafKey(parts, f.label), field: f });
      }
    });
    (node.subGroups || []).forEach(sg => walk(sg, [...parts, acronym(sg.title)]));
  };

  walk(stepSchema, pathParts);
  return leaves;
}
