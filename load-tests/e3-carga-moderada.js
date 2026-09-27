// E3 — 50 usuarios concurrentes (mm1 §3.14, Tabla 3.14.1).
// Metrics of interest: throughput (req/s) and 5xx errors at peak load. A
// short ramp-up (20s) avoids opening 50 sockets in the same instant, which
// would measure connection-storm behavior rather than sustained peak
// throughput; the peak of 50 VUs is held for 2 minutes so p95/throughput are
// measured on a stable plateau, then ramped down.
import { login, runJourney, xffForVU } from './journey.js';
import { buildHandleSummary, buildEndpointThresholds } from './summary.js';

export const options = {
  scenarios: {
    e3_carga_moderada: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 50 }, // ramp-up to peak
        { duration: '2m', target: 50 }, // sustained peak (recorded as VUs=50)
        { duration: '10s', target: 0 }, // ramp-down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Relaxed vs. E1/E2: 50 concurrent users on a single local machine that
    // is also running k6 itself will legitimately see higher tail latency
    // than 1-10 users. 5xx errors are the metric that actually matters here
    // (see README "Interpretación") -- http_req_failed catches both.
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.98'],
    ...buildEndpointThresholds(1500, 0.02),
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

export const handleSummary = buildHandleSummary('e3-carga-moderada');
