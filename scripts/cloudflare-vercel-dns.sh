#!/usr/bin/env bash
# Print / apply Cloudflare DNS records needed for renacon.in → Vercel.
# Registrar can stay GoDaddy; nameservers should remain Cloudflare.
#
# Usage:
#   bash scripts/cloudflare-vercel-dns.sh
#   CF_API_TOKEN=... CF_ZONE_ID=... bash scripts/cloudflare-vercel-dns.sh --apply
set -euo pipefail

APEX="renacon.in"
WWW="www.renacon.in"
# Vercel recommended values for this project (from Vercel Domains API).
VERCEL_A_PRIMARY="76.76.21.21"
VERCEL_CNAME="cname.vercel-dns.com"

cat <<EOF
Cloudflare DNS for ${APEX} → Vercel (images served from this app's public/assets/wp-content)

1) Cloudflare dashboard → ${APEX} → DNS → Records

   Type    Name    Content                 Proxy
   A       @       ${VERCEL_A_PRIMARY}     Proxied (orange) OR DNS-only
   CNAME   www     ${VERCEL_CNAME}         Proxied (orange) OR DNS-only

   Remove any A/AAAA/CNAME that still point at the old LiteSpeed host (e.g. 217.21.92.159).

2) SSL/TLS → Overview → mode: Full (strict)
   (Flexible SSL breaks Vercel + causes mixed/image issues.)

3) Speed → Optimization:
   - Turn OFF Rocket Loader if scripts/images glitch
   - Auto Minify: leave JS off if you see header/nav bugs

4) Vercel project already has domains: renacon.in, www.renacon.in, renacon.vercel.app
   After DNS propagates, https://${APEX}/wp-content/uploads/2023/05/logo-green.png
   must return 200 from Vercel (not LiteSpeed).

5) Until DNS is switched, production app is live at:
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

echo "Applying Cloudflare DNS via API…"
# Upsert apex A
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

# Upsert www CNAME
existing=$(cf GET "/zones/${CF_ZONE_ID}/dns_records?type=CNAME&name=${WWW}")
rid=$(python3 -c 'import json,sys; d=json.load(sys.stdin); r=d.get("result") or []; print(r[0]["id"] if r else "")' <<<"$existing")
payload=$(python3 - <<PY
import json
print(json.dumps({
  "type":"CNAME","name":"www","content":"${VERCEL_CNAME}","ttl":1,"proxied":True
}))
PY
)
if [[ -n "$rid" ]]; then
  cf PUT "/zones/${CF_ZONE_ID}/dns_records/${rid}" -d "$payload" >/dev/null
  echo "Updated CNAME www → ${VERCEL_CNAME}"
else
  cf POST "/zones/${CF_ZONE_ID}/dns_records" -d "$payload" >/dev/null
  echo "Created CNAME www → ${VERCEL_CNAME}"
fi

echo "Done. Wait for propagation, then verify:"
echo "  dig +short ${APEX} A"
echo "  curl -sI https://${APEX}/wp-content/uploads/2023/05/logo-green.png | head"
