#!/usr/bin/env bash
# Smoke test: verifica que todos os endpoints respondem com status correcto apos deploy.
# Uso: BASE_URL=https://your-deploy.vercel.app bash scripts/smoke-test.sh
# Se BASE_URL nao estiver definido, usa http://localhost:3000

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local url="$3"
  local method="${4:-GET}"
  local body="${5:-}"
  local extra_headers="${6:-}"

  local args=(-s -o /dev/null -w "%{http_code}" -X "$method" "$url")
  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi
  if [ -n "$extra_headers" ]; then
    args+=(-H "$extra_headers")
  fi

  local actual
  actual=$(curl "${args[@]}" --max-time 10 2>/dev/null || echo "000")

  if [ "$actual" = "$expected" ]; then
    echo "  PASS  [$actual] $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  [$actual != $expected] $label"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "Smoke test: $BASE_URL"
echo "============================================="

echo ""
echo "--- Paginas publicas ---"
check "Homepage"                        "200" "$BASE_URL/"
check "Backstage login page"            "200" "$BASE_URL/backstage/login"

echo ""
echo "--- Redireccao de autenticacao ---"
check "Backstage sem token -> redirect" "307" "$BASE_URL/backstage"

echo ""
echo "--- Endpoints de API (publicos) ---"
check "Health check"                    "200" "$BASE_URL/api/health"
check "Chat SSE stream (cabecalho)"     "200" "$BASE_URL/api/chat"
check "Events SSE stream (cabecalho)"   "200" "$BASE_URL/api/events"
check "Reactions endpoint"              "400" "$BASE_URL/api/reactions" "POST" "{}"

echo ""
echo "--- Endpoints de API (protegidos sem token) ---"
check "Analytics sem auth -> 401"       "401" "$BASE_URL/api/analytics"
check "Admin command sem auth -> 401"   "401" "$BASE_URL/api/admin/command"

echo ""
echo "--- Validacao de input do chat ---"
check "Chat POST sem body -> 400"       "400" "$BASE_URL/api/chat" "POST" "{}"
check "Chat POST valido -> 201"         "201" "$BASE_URL/api/chat" "POST" '{"user":"smoke","text":"teste de smoke"}'

echo ""
echo "============================================="
echo "Resultado: $PASS passou(aram), $FAIL falhou(aram)"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
