// ES 9(Lucene 10)는 그룹 품사 태그 E(어미)/J(조사)를 지원하지 않아
// nestjs-es-kit koreanAnalysis() 기본값 대신 세분화된 태그를 명시한다.
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
