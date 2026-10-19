# Repeticiones locales (E1-E4)

Fixed workload, 5 repetitions per scenario, against the local stack
(`http://localhost:4000/api`, backend in production mode, local Postgres).

- Workload plan (VUs and iterations) lives in `load-tests/repetitions.js` and is shared with production runs.
- Run: `cd load-tests && ADMIN_EMAIL=... ADMIN_PASSWORD=... ./run-repetitions.sh` (env: `REPS`, `OUT_DIR`, `BASE_URL`, `SCENARIOS`, `PAUSE`).
- Aggregate: `node aggregate-repetitions.mjs results/repeticiones-local`.
- Output: `<scenario>/rep-N.json` (raw k6 summary), `rep-N.log`, `resumen-repeticiones.csv|md`.
- Non-local `BASE_URL` is refused unless `ALLOW_REMOTE=1`.
- Requests per repetition = iterations x 6 + 1 (setup login).
