#!/usr/bin/env bash
# 상품 검색 API 테스트용 시드 데이터를 벌크 색인한다.
# 사용법: ./scripts/seed.sh [API_URL]
set -euo pipefail

API_URL="${1:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

curl -sf -X POST "$API_URL/products/bulk" \
  -H 'Content-Type: application/json' \
  --data-binary "@$SCRIPT_DIR/seed-products.json"
echo
