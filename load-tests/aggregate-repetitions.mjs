// Aggregates the per-repetition k6 summaries written by run-repetitions.sh.
// Usage: node aggregate-repetitions.mjs [outDir]   (default results/repeticiones-local)
// Reports, per scenario: repetitions, requests per repetition (and whether all
// repetitions match), mean of the per-repetition average latency, its sample
// standard deviation, mean p95, error rate and checks rate.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] || 'results/repeticiones-local';
const ORDER = ['e1-individual', 'e2-carga-ligera', 'e3-carga-moderada', 'e4-sostenida'];

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
const r2 = (n) => Math.round(n * 100) / 100;

const rows = [];
for (const scenario of ORDER) {
  const dir = join(outDir, scenario);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir)
    .filter((f) => /^rep-\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10));
  if (files.length === 0) continue;

  const reps = files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  const counts = reps.map((d) => d.metrics.http_reqs.values.count);
  const avgs = reps.map((d) => d.metrics.http_req_duration.values.avg);
  const p95s = reps.map((d) => d.metrics.http_req_duration.values['p(95)']);
  const errs = reps.map((d) => d.metrics.http_req_failed.values.rate * 100);
  const chk = reps.map((d) => d.metrics.checks.values.rate * 100);
  const { vus, iterations } = reps[0].meta || {};

  rows.push({
    escenario: scenario,
    vus,
    iteraciones: iterations,
    repeticiones: reps.length,
    peticiones_por_rep: counts[0],
    peticiones_iguales: counts.every((c) => c === counts[0]) ? 'si' : `NO (${counts.join('/')})`,
    latencia_avg_media_ms: r2(mean(avgs)),
    latencia_avg_desv_ms: r2(stdev(avgs)),
    latencia_p95_media_ms: r2(mean(p95s)),
    tasa_error_pct: r2(mean(errs)),
    checks_pct: r2(mean(chk)),
    avg_por_rep_ms: avgs.map(r2).join(' / '),
  });
}

if (rows.length === 0) {
  console.error(`No repetition files found under ${outDir}`);
  process.exit(1);
}

const cols = Object.keys(rows[0]);
writeFileSync(
  join(outDir, 'resumen-repeticiones.csv'),
  [cols.join(','), ...rows.map((r) => cols.map((c) => String(r[c]).replaceAll(',', ';')).join(','))].join('\n') + '\n',
);

const md = [
  '# Resumen de repeticiones',
  '',
  'Latencia: media de la latencia promedio de cada repetición (desviación estándar muestral entre repeticiones).',
  'Las peticiones incluyen el inicio de sesión de `setup()` (1 por repetición).',
  '',
  '| Escenario | VUs | Iteraciones | Repeticiones | Peticiones por rep. | ¿Iguales? | Latencia media (ms) | Desv. (ms) | p95 medio (ms) | Error % | Checks % |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.escenario} | ${r.vus} | ${r.iteraciones} | ${r.repeticiones} | ${r.peticiones_por_rep} | ${r.peticiones_iguales} | ${r.latencia_avg_media_ms} | ${r.latencia_avg_desv_ms} | ${r.latencia_p95_media_ms} | ${r.tasa_error_pct} | ${r.checks_pct} |`,
  ),
  '',
  '## Latencia promedio por repetición (ms)',
  '',
  ...rows.map((r) => `- ${r.escenario}: ${r.avg_por_rep_ms}`),
  '',
].join('\n');
writeFileSync(join(outDir, 'resumen-repeticiones.md'), md);
console.log(md);
