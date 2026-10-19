// Fixed-workload plan shared by the repetition runs (local and production).
// Every scenario issues the same number of journeys (6 requests each, plus one
// login in setup), so a given scenario sends identical traffic in both
// environments and in each of its repetitions.
//
// ITER_SCALE (default 1) shrinks the iterations for smoke runs only; never set
// it for the real measurement or the request counts stop being comparable.
import { scenarioMarkdown } from './summary.js';
import { BASE_URL } from './config.js';

export const REPETITION_PLAN = {
  e1: { vus: 1, iterations: 30 },
  e2: { vus: 10, iterations: 100 },
  e3: { vus: 50, iterations: 400 },
  e4: { vus: 20, iterations: 600 },
};

const ITER_SCALE = Number(__ENV.ITER_SCALE || 1);

export function plannedLoad(key) {
  const plan = REPETITION_PLAN[key];
  return {
    vus: plan.vus,
    iterations: Math.max(plan.vus, Math.round(plan.iterations * ITER_SCALE)),
  };
}

// `shared-iterations` fixes the total number of journeys while VUs keep the
// concurrency level of the scenario; maxDuration is only a safety net.
export function sharedIterations(key) {
  const { vus, iterations } = plannedLoad(key);
  return { executor: 'shared-iterations', vus, iterations, maxDuration: '30m' };
}

// Writes one raw summary per repetition at SUMMARY_OUT (set by
// run-repetitions.sh) instead of the shared results/<scenario>.json, so the
// single-run results already in results/ are never overwritten.
export function buildRepetitionSummary(scenarioName, key) {
  return function handleSummary(data) {
    const out = __ENV.SUMMARY_OUT || `results/repeticiones-local/${scenarioName}/adhoc.json`;
    const meta = { scenario: scenarioName, baseUrl: BASE_URL, ...plannedLoad(key) };
    return {
      [out]: JSON.stringify({ meta, ...data }, null, 2),
      stdout: scenarioMarkdown(scenarioName, data) + '\n',
    };
  };
}
