#!/usr/bin/env bash
# Runs E1-E4, REPS times each, with the fixed workload from repetitions.js and
# stores one raw k6 summary per repetition:
#   $OUT_DIR/<scenario>/rep-N.json   (+ rep-N.log with the k6 console output)
#
# Env: BASE_URL (default local API), REPS (default 5), OUT_DIR, SCENARIOS,
#      PAUSE (seconds between runs, default 15), ITER_SCALE (smoke runs only).
# Remote targets are refused unless ALLOW_REMOTE=1 is set explicitly.
set -euo pipefail
cd "$(dirname "$0")"

BASE_URL="${BASE_URL:-http://localhost:4000/api}"
REPS="${REPS:-5}"
OUT_DIR="${OUT_DIR:-results/repeticiones-local}"
SCENARIOS="${SCENARIOS:-e1-individual e2-carga-ligera e3-carga-moderada e4-sostenida}"
PAUSE="${PAUSE:-15}"

case "$BASE_URL" in
  http://localhost:*|http://127.0.0.1:*) ;;
  *)
    if [ "${ALLOW_REMOTE:-0}" != "1" ]; then
      echo "Refusing non-local BASE_URL '$BASE_URL' (set ALLOW_REMOTE=1 to override)." >&2
      exit 1
    fi
    ;;
esac

for scenario in $SCENARIOS; do
  mkdir -p "$OUT_DIR/$scenario"
  for rep in $(seq 1 "$REPS"); do
    echo ">> $scenario repetition $rep/$REPS ($BASE_URL)"
    SUMMARY_OUT="$OUT_DIR/$scenario/rep-$rep.json" \
      k6 run --quiet \
        -e BASE_URL="$BASE_URL" \
        -e SUMMARY_OUT="$OUT_DIR/$scenario/rep-$rep.json" \
        -e ITER_SCALE="${ITER_SCALE:-1}" \
        "$scenario.js" > "$OUT_DIR/$scenario/rep-$rep.log" 2>&1 || \
      echo "   k6 exited non-zero for $scenario rep $rep (thresholds or errors); see log"
    # Keeps the 5/min login throttle (setup login, same X-Forwarded-For) from
    # tripping between consecutive runs.
    sleep "$PAUSE"
  done
done
echo "Done. Aggregate with: node aggregate-repetitions.mjs $OUT_DIR"
