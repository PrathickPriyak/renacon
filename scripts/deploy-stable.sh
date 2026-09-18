#!/usr/bin/env bash
# Deploy to the SAME permanent Vercel production URL every time.
# Requires: VERCEL_TOKEN (https://vercel.com/account/tokens)
#
# Works with classic user tokens AND project/team tokens (vcp_*):
# project tokens often fail `vercel whoami`, so we fall back to the Deployments API.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens" >&2
  exit 1
fi

ORG_ID="${VERCEL_ORG_ID:-team_TaDueuIoGc39uzO1FWIjeRmW}"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-renacon}"
PROJECT_ID="${VERCEL_PROJECT_ID:-prj_l8JUlW0Eua6JtBVEILaM85QYkWvZ}"
ALIAS="${VERCEL_ALIAS:-renacon.vercel.app}"
REF="${VERCEL_GIT_REF:-$(git rev-parse --abbrev-ref HEAD)}"

api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -sS -X "$method" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com${path}" \
    "$@"
}

deploy_via_api() {
  echo "Deploying via Vercel API (git ref: ${REF})…"
  local payload
  payload=$(python3 - <<PY
import json
print(json.dumps({
  "name": "${PROJECT_NAME}",
  "project": "${PROJECT_NAME}",
  "target": "production",
  "gitSource": {
    "type": "github",
    "org": "PrathickPriyak",
    "repo": "renacon",
    "ref": "${REF}",
  },
}))
PY
)

  local create
  create=$(api POST "/v13/deployments?teamId=${ORG_ID}&forceNew=1" -d "$payload")
  local dpl
  dpl=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("id") or "")' <<<"$create")
  if [[ -z "$dpl" ]]; then
    echo "API deploy failed:" >&2
    echo "$create" >&2
    exit 1
  fi
  echo "Deployment ${dpl} created. Waiting for READY…"

  local state=""
  for _ in $(seq 1 60); do
    local info
    info=$(api GET "/v13/deployments/${dpl}?teamId=${ORG_ID}")
    state=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("readyState") or "")' <<<"$info")
    echo "  state=${state}"
    case "$state" in
      READY)
        break
        ;;
      ERROR|CANCELED)
        echo "$info" >&2
        exit 1
        ;;
    esac
    sleep 5
  done

  if [[ "$state" != "READY" ]]; then
    echo "Timed out waiting for deployment ${dpl}" >&2
    exit 1
  fi

  echo "Ensuring project domain ${ALIAS}…"
  api POST "/v10/projects/${PROJECT_ID}/domains?teamId=${ORG_ID}" \
    -d "{\"name\":\"${ALIAS}\"}" >/dev/null || true

  echo "Assigning alias ${ALIAS}…"
  api POST "/v2/deployments/${dpl}/aliases?teamId=${ORG_ID}" \
    -d "{\"alias\":\"${ALIAS}\"}" >/dev/null || true
  echo "Live: https://${ALIAS}"
}

# Prefer CLI when the token can resolve a user; otherwise use API.
if npx vercel whoami --token "$VERCEL_TOKEN" >/dev/null 2>&1; then
  ARGS=(--prod --yes --token "$VERCEL_TOKEN")
  if [[ -n "${ORG_ID:-}" ]]; then
    ARGS+=(--scope "$ORG_ID")
  fi
  if [[ ! -f .vercel/project.json ]]; then
    npx vercel link --yes --project "$PROJECT_NAME" --token "$VERCEL_TOKEN" \
      ${ORG_ID:+--scope "$ORG_ID"} || true
  fi
  echo "Deploying production via Vercel CLI…"
  npx vercel deploy "${ARGS[@]}"
else
  echo "Token cannot call whoami (common for vcp_* project tokens). Using API deploy."
  deploy_via_api
fi
