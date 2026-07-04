#!/usr/bin/env node
// 로그 집계 테스트용 시드 데이터를 생성해 벌크 색인한다.
// 사용법: node scripts/seed-logs.mjs [건수] [API_URL]
//   예: node scripts/seed-logs.mjs 10000 http://localhost:3000

const TOTAL = Number(process.argv[2] ?? 10000);
const API_URL = process.argv[3] ?? 'http://localhost:3000';
const CHUNK_SIZE = 2000;
const DAYS = 7; // 최근 7일에 분산

const SERVICES = [
  'gateway',
  'auth-api',
  'product-api',
  'order-api',
  'payment-api',
  'search-api',
];

const PATHS = {
  gateway: ['/health', '/api/v1/route', '/metrics'],
  'auth-api': ['/auth/login', '/auth/refresh', '/auth/logout', '/users/me'],
  'product-api': ['/products', '/products/search', '/products/facets'],
  'order-api': ['/orders', '/orders/history', '/carts/items'],
  'payment-api': ['/payments', '/payments/confirm', '/payments/cancel'],
  'search-api': ['/search', '/search/suggest', '/search/popular'],
};

const METHODS = ['GET', 'GET', 'GET', 'POST', 'POST', 'PUT', 'DELETE'];

// 레벨 가중치: info 68%, debug 15%, warn 9%, error 7%, fatal 1%
const LEVEL_WEIGHTS = [
  ['info', 68],
  ['debug', 15],
  ['warn', 9],
  ['error', 7],
  ['fatal', 1],
];

const INFO_MESSAGES = [
  '요청 처리 완료',
  '사용자 인증 성공',
  '상품 목록 조회 성공',
  '주문 생성 완료',
  '결제 승인 완료',
  '검색 결과 반환 완료',
  '캐시 적중으로 응답 반환',
  '세션 갱신 완료',
];

const DEBUG_MESSAGES = [
  '쿼리 실행 계획 확인',
  '캐시 키 생성 완료',
  '요청 파라미터 파싱 완료',
  '외부 API 응답 수신',
];

const WARN_MESSAGES = [
  '응답 지연 임계치 초과',
  '재시도 후 요청 성공',
  '캐시 미스 발생률 증가',
  '요청 파라미터 검증 실패로 기본값 사용',
  '커넥션 풀 사용률 80% 초과',
];

// 에러 메시지는 고정 풀에서 반복시켜 Top N 집계가 의미 있게 나오도록 한다
const ERROR_MESSAGES = [
  '데이터베이스 연결 시간 초과',
  '결제 승인 실패: 카드 한도 초과',
  'Elasticsearch 클러스터 응답 없음',
  'JWT 토큰 검증 실패',
  '재고 차감 중 동시성 충돌 발생',
  '외부 API 호출 실패: 타임아웃',
  '요청 본문 역직렬화 실패',
  '권한 없는 리소스 접근 시도',
  '메시지 큐 발행 실패',
  '중복 주문 요청 감지',
];

const FATAL_MESSAGES = [
  '서비스 기동 실패: 필수 환경변수 누락',
  '데이터베이스 커넥션 풀 고갈',
  '디스크 용량 부족으로 쓰기 실패',
];

const MESSAGE_POOL = {
  info: INFO_MESSAGES,
  debug: DEBUG_MESSAGES,
  warn: WARN_MESSAGES,
  error: ERROR_MESSAGES,
  fatal: FATAL_MESSAGES,
};

const STATUS_POOL = {
  info: [200, 200, 200, 201, 204],
  debug: [200],
  warn: [200, 400, 404, 409, 429],
  error: [500, 500, 502, 503, 400],
  fatal: [500, 503],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const pickLevel = () => {
  const total = LEVEL_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [level, weight] of LEVEL_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return level;
  }
  return 'info';
};

// 야간(0~7시)은 트래픽이 적도록 시간대에 가중치를 준다
const randomTimestamp = () => {
  const now = Date.now();
  for (;;) {
    const ts = now - Math.random() * DAYS * 24 * 60 * 60 * 1000;
    const hour = new Date(ts).getHours();
    const keepRate = hour >= 0 && hour < 7 ? 0.25 : 1;
    if (Math.random() < keepRate) return new Date(ts).toISOString();
  }
};

const randomDuration = (level) => {
  // 대부분 짧고 가끔 긴 로그정규분포 근사
  const base = Math.exp(Math.random() * 3 + 2); // ~7ms에서 ~150ms
  const slow = level === 'warn' || level === 'error' ? 3 : 1;
  return Math.min(Math.round(base * slow), 30000);
};

const makeLog = () => {
  const level = pickLevel();
  const service = pick(SERVICES);
  return {
    level,
    service,
    message: pick(MESSAGE_POOL[level]),
    traceId: crypto.randomUUID(),
    method: pick(METHODS),
    path: pick(PATHS[service]),
    statusCode: pick(STATUS_POOL[level]),
    durationMs: randomDuration(level),
    timestamp: randomTimestamp(),
  };
};

const main = async () => {
  console.log(`${TOTAL.toLocaleString()}건 생성 → ${API_URL}/logs/bulk`);
  let succeeded = 0;
  let failed = 0;

  for (let sent = 0; sent < TOTAL; sent += CHUNK_SIZE) {
    const count = Math.min(CHUNK_SIZE, TOTAL - sent);
    const logs = Array.from({ length: count }, makeLog);

    const res = await fetch(`${API_URL}/logs/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const result = await res.json();
    succeeded += result.succeeded;
    failed += result.failed;
    process.stdout.write(
      `\r진행: ${Math.min(sent + count, TOTAL).toLocaleString()}/${TOTAL.toLocaleString()}`,
    );
  }

  console.log(`\n완료 — 성공: ${succeeded.toLocaleString()}, 실패: ${failed}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
