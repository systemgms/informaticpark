// E1 — 1 usuario (mm1 §3.14, Tabla 3.14.1).
// Metrics of interest: response time (avg/p95/max) and success rate, under
// zero contention. This is the baseline every other scenario is compared
// against.
import { login, runJourney, xffForVU } from './journey.js';
import { buildHandleSummary } from './summary.js';

export const options = {
  scenarios: {
    e1_individual: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m',
    },
  },
  thresholds: {
    // Tighter than the shared default: a single user on an otherwise idle
    // local server should be fast and never fail.
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const token = login(xffForVU(1));
  if (!token) {
    throw new Error('Setup login failed: no accessToken returned. Is the backend up and seeded?');
  }
  return { token };
}

export default function (data) {
  runJourney(data.token, __VU);
}

export const handleSummary = buildHandleSummary('e1-individual');
