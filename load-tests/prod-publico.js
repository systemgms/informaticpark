// Production scenarios (E1-prod, E2-prod) over public, read-only endpoints.
//
// Production keeps the per-IP throttler (60 GET/min) and trusts exactly one
// proxy hop, so a single load generator is one client: this script does NOT
// spoof X-Forwarded-For. Think time is sized so the total rate stays under the
// limit; the run measures real network latency under concurrency, not maximum
// throughput. No credentials are needed and nothing is written.
//
//   k6 run -e BASE_URL=https://informaticpark-nine.vercel.app/api -e VUS=1  -e THINK=1.5 -e DURATION=2m prod-publico.js
//   k6 run -e BASE_URL=https://informaticpark-nine.vercel.app/api -e VUS=10 -e THINK=11  -e DURATION=3m prod-publico.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://informaticpark-nine.vercel.app/api';
const VUS = Number(__ENV.VUS || 1);
const THINK = Number(__ENV.THINK || 1.5);
const DURATION = __ENV.DURATION || '2m';
const P95_LIMIT_MS = Number(__ENV.P95_LIMIT_MS || (VUS > 1 ? 1000 : 500));

export const options = {
  scenarios: {
    publico: { executor: 'constant-vus', vus: VUS, duration: DURATION },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: [`p(95)<${P95_LIMIT_MS}`],
    checks: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const REQUESTS = [
  { name: 'public_assets', path: '/public/assets?limit=20' },
  { name: 'public_assets_search', path: '/public/assets?search=Computador&limit=20' },
  { name: 'public_custodians', path: '/public/custodians?limit=20' },
  { name: 'locations', path: '/locations?page=1&limit=20' },
  { name: 'brand_settings', path: '/brand-settings' },
];

export default function () {
  for (const request of REQUESTS) {
    const res = http.get(`${BASE_URL}${request.path}`, { tags: { name: request.name } });
    check(res, { [`${request.name} 200`]: (r) => r.status === 200 });
    sleep(THINK);
  }
}
