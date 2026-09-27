// Shared configuration for the OE3 load tests (k6). Every scenario imports
// from here so the four scripts stay consistent and env-overridable.
//
// Override any value with `-e NAME=value` when invoking `k6 run`, e.g.:
//   k6 run -e BASE_URL=http://localhost:4000/api e1-individual.js

// Backend base URL. Defaults to the local NestJS API (see root CLAUDE.md).
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';

// Admin credentials used to log in once per test run (see journey.js). These
// default to the local `prisma:seed` admin account, never a real one.
export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@example.com';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin123!';

// "Think time" between steps of a user journey, in seconds, to model a human
// reading a page before clicking the next thing rather than hammering the
// API back-to-back.
export const THINK_TIME_MIN = Number(__ENV.THINK_TIME_MIN || 1);
export const THINK_TIME_MAX = Number(__ENV.THINK_TIME_MAX || 2);

// Prefix used by seed.sql/cleanup.sql so seeded rows are trivially
// identifiable and removable (see load-tests/README.md).
export const SEED_PREFIX = 'LT';

// Baseline thresholds shared by every scenario, tuned to the acceptance
// criteria discussed in odd/tasks/load-tests.md:
//   - http_req_failed < 1%: a local single-machine API serving simple,
//     indexed Prisma queries should not fail requests under normal load;
//     any failure rate above 1% signals a real problem (crash, DB
//     exhaustion, 429s), not noise.
//   - p(95) < 1000ms: generous for a local Bun/NestJS process on
//     loopback, but tight enough to catch obvious regressions (e.g. an
//     unindexed query or N+1) without being flaky on a shared dev laptop
//     also running k6 itself.
// Individual scenarios tighten (E1) or relax (E3 under peak concurrency)
// these where that is more representative of the scenario being modeled.
export const DEFAULT_THRESHOLDS = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<1000'],
};
