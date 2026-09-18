#!/usr/bin/env bash
# Print / apply Cloudflare DNS so apex renacon.in → Vercel.
# Registrar can stay GoDaddy; nameservers should remain Cloudflare.
# www is not used.
#
# Usage:
#   bash scripts/cloudflare-vercel-dns.sh
#   CF_API_TOKEN=... CF_ZONE_ID=... bash scripts/cloudflare-vercel-dns.sh --apply
set -euo pipefail

APEX="renacon.in"
# Vercel recommended apex A record for this project.
VERCEL_A_PRIMARY="76.76.21.21"

cat <<EOF
Cloudflare DNS for ${APEX} only → Vercel (no www)

1) Cloudflare dashboard → ${APEX} → DNS → Records

   Type    Name    Content                 Proxy
   A       @       ${VERCEL_A_PRIMARY}     Proxied (orange) OR DNS-only

   Do not add a www CNAME. Delete www if it exists.
   Remove any A/AAAA that still point at the old LiteSpeed host (e.g. 217.21.92.159).

2) SSL/TLS → Overview → mode: Full (strict)
   Flexible SSL causes ERR_TOO_MANY_REDIRECTS.

3) Security → Bots: turn Bot Fight Mode off (or it 403s the homepage).

4) Vercel already has the apex domain: ${APEX}
   After DNS propagates, https://${APEX}/ must return server: Vercel.

5) Until DNS is switched, the site is live at:
   https://renacon.vercel.app/

EOF

if [[ "${1:-}" != "--apply" ]]; then
  exit 0
fi

if [[ -z "${CF_API_TOKEN:-}" || -z "${CF_ZONE_ID:-}" ]]; then
  echo "Need CF_API_TOKEN and CF_ZONE_ID to --apply" >&2
  exit 1
fi

cf() {
  local method="$1" path="$2"
  shift 2
  curl -sS -X "$method" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4${path}" \
    "$@"
}

echo "Applying Cloudflare DNS via API (apex only)…"
existing=$(cf GET "/zones/${CF_ZONE_ID}/dns_records?type=A&name=${APEX}")
rid=$(python3 -c 'import json,sys; d=json.load(sys.stdin); r=d.get("result") or []; print(r[0]["id"] if r else "")' <<<"$existing")
payload=$(python3 - <<PY
import json
print(json.dumps({
  "type":"A","name":"@","content":"${VERCEL_A_PRIMARY}","ttl":1,"proxied":True
}))
PY
)
if [[ -n "$rid" ]]; then
  cf PUT "/zones/${CF_ZONE_ID}/dns_records/${rid}" -d "$payload" >/dev/null
  echo "Updated A @ → ${VERCEL_A_PRIMARY}"
else
  cf POST "/zones/${CF_ZONE_ID}/dns_records" -d "$payload" >/dev/null
  echo "Created A @ → ${VERCEL_A_PRIMARY}"
fi

echo "Done. Wait for propagation, then verify:"
echo "  curl -sI https://${APEX}/ | head"
echo "  (Expect server: Vercel and HTTP 200)"
