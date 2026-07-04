// 어미/조사 등 검색에 불필요한 품사를 색인에서 제거한다.
// nestjs-es-kit v1.0.0부터 기본 stoptags가 빈 배열(제거 없음)이므로 직접 지정한다.
// ES 9(Lucene 10)는 그룹 태그 E(어미)/J(조사)를 지원하지 않아 세분화된 태그를 사용한다.
export const ES9_STOPTAGS = [
  'EP',
  'EF',
  'EC',
  'ETN',
  'ETM', // 어미 (구 E)
  'JKS',
  'JKC',
  'JKG',
  'JKO',
  'JKB',
  'JKV',
  'JKQ',
  'JX',
  'JC', // 조사 (구 J)
  'IC',
  'MAG',
  'MAJ',
  'MM',
  'SP',
  'SSC',
  'SSO',
  'SC',
  'SE',
  'XPN',
  'XSA',
  'XSN',
  'XSV',
  'UNA',
  'NA',
  'VSV',
];
