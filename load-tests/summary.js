// Custom, dependency-free summary formatting (no jslib.k6.io import, so the
// scenarios run fully offline) shared by every scenario's handleSummary().
//
// Per-endpoint breakdowns rely on k6 only computing a tagged sub-metric
// (e.g. `http_req_duration{endpoint:assets_list}`) when it is referenced by
// a threshold. buildEndpointThresholds() below exists specifically to force
// that computation for every journey step, so handleSummary() can read it
// back from `data.metrics`.
export const ENDPOINT_TAGS = [
  'assets_stats',
  'assets_list',
  'assets_search',
  'assets_detail',
  'custodian_assets',
  'public_assets',
];

function fmt(n, digits = 2) {
  return typeof n === 'number' && !Number.isNaN(n) ? n.toFixed(digits) : 'n/a';
}

function values(data, name) {
  const metric = data.metrics[name];
  return metric ? metric.values : null;
}

export function buildEndpointThresholds(p95Ms, errorRate) {
  const thresholds = {};
  for (const tag of ENDPOINT_TAGS) {
    thresholds[`http_req_duration{endpoint:${tag}}`] = [`p(95)<${p95Ms}`];
    thresholds[`http_req_failed{endpoint:${tag}}`] = [`rate<${errorRate}`];
  }
  return thresholds;
}

export function scenarioMarkdown(scenarioName, data) {
  const reqs = values(data, 'http_reqs');
  const dur = values(data, 'http_req_duration');
  const failed = values(data, 'http_req_failed');
  const checks = values(data, 'checks');
  const durationSec = (data.state && data.state.testRunDurationMs
    ? data.state.testRunDurationMs
    : 0) / 1000;
  const throughput = reqs && durationSec > 0 ? reqs.count / durationSec : NaN;

  const lines = [];
  lines.push(`# Resultados: ${scenarioName}`);
  lines.push('');
  lines.push(`| Métrica | Valor |`);
  lines.push(`|---|---|`);
  lines.push(`| Duración real | ${fmt(durationSec)} s |`);
  lines.push(`| Peticiones totales | ${reqs ? reqs.count : 'n/a'} |`);
  lines.push(`| Throughput | ${fmt(throughput)} req/s |`);
  lines.push(`| Latencia promedio | ${dur ? fmt(dur.avg) : 'n/a'} ms |`);
  lines.push(`| Latencia p95 | ${dur ? fmt(dur['p(95)']) : 'n/a'} ms |`);
  lines.push(`| Latencia máxima | ${dur ? fmt(dur.max) : 'n/a'} ms |`);
  lines.push(
    `| Tasa de error (http_req_failed) | ${failed ? fmt(failed.rate * 100) : 'n/a'}% |`,
  );
  lines.push(
    `| Checks exitosos | ${checks ? fmt(checks.rate * 100) : 'n/a'}% |`,
  );
  lines.push('');
  lines.push('## Por endpoint');
  lines.push('');
  lines.push('| Endpoint | Peticiones | p95 (ms) | Error % |');
  lines.push('|---|---|---|---|');
  for (const tag of ENDPOINT_TAGS) {
    const d = values(data, `http_req_duration{endpoint:${tag}}`);
    const f = values(data, `http_req_failed{endpoint:${tag}}`);
    lines.push(
      `| ${tag} | ${d ? d.count ?? 'n/a' : 'n/a'} | ${d ? fmt(d['p(95)']) : 'n/a'} | ${f ? fmt(f.rate * 100) : 'n/a'} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

// Returns a handleSummary() implementation that writes both the raw k6
// summary JSON (results/<scenario>.json, gitignored -- see .gitignore) and a
// compact Markdown table (results/<scenario>.md, versioned) ready to paste
// into the thesis, plus echoes the Markdown to stdout for the terminal.
export function buildHandleSummary(scenarioName) {
  return function handleSummary(data) {
    const md = scenarioMarkdown(scenarioName, data);
    return {
      [`results/${scenarioName}.json`]: JSON.stringify(data, null, 2),
      [`results/${scenarioName}.md`]: md,
      stdout: md + '\n',
    };
  };
}
