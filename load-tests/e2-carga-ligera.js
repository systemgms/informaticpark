// E2 — 10 usuarios concurrentes (mm1 §3.14, Tabla 3.14.1).
// Metric of interest: p95 latency under light concurrency. "Cold start" does
// not apply here: this runs against an already-warm local process (started
// once in T2 and kept running across E1-E4), not a serverless/edge
// deployment that scales from zero -- see README "Limitaciones locales".
import { login, runJourney, xffForVU } from './journey.js';
import { buildHandleSummary, buildEndpointThresholds } from './summary.js';

export const options = {
  scenarios: {
    e2_carga_ligera: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],
    ...buildEndpointThresholds(1000, 0.01),
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

export const handleSummary = buildHandleSummary('e2-carga-ligera');
