#!/usr/bin/env bash
# Deploy to the SAME permanent Vercel production URL every time.
# Requires: VERCEL_TOKEN (https://vercel.com/account/tokens)
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens" >&2
  exit 1
fi

ARGS=(--prod --yes --token "$VERCEL_TOKEN")
if [[ -n "${VERCEL_ORG_ID:-}" ]]; then
  ARGS+=(--scope "$VERCEL_ORG_ID")
fi

if [[ ! -f .vercel/project.json ]]; then
  npx vercel link --yes --project renacon --token "$VERCEL_TOKEN" ${VERCEL_ORG_ID:+--scope "$VERCEL_ORG_ID"} || true
fi

echo "Deploying production to stable project…"
npx vercel deploy "${ARGS[@]}"
