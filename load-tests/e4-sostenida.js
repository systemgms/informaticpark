// E4 — 20 usuarios durante 5 minutos (mm1 §3.14, Tabla 3.14.1).
// Metric of interest: availability over a sustained window (does the error
// rate/latency stay flat, or does it degrade/leak over 5 minutes?).
import { login, runJourney, xffForVU } from './journey.js';
import { buildHandleSummary, buildEndpointThresholds } from './summary.js';

export const options = {
  scenarios: {
    e4_sostenida: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1200'],
    checks: ['rate>0.99'],
    ...buildEndpointThresholds(1200, 0.01),
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

export const handleSummary = buildHandleSummary('e4-sostenida');
