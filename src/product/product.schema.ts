import { EsIndex, EsField, koreanAnalysis } from 'nestjs-es-kit';

// ES 9(Lucene 10)는 그룹 품사 태그 E(어미)/J(조사)를 지원하지 않아
// 라이브러리 기본값 대신 세분화된 태그를 명시한다.
const ES9_STOPTAGS = [
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

@EsIndex({
  name: 'products',
  settings: {
    numberOfShards: 1,
    numberOfReplicas: 0,
    analysis: koreanAnalysis({ stoptags: ES9_STOPTAGS }),
  },
})
export class Product {
  @EsField({ type: 'keyword' })
  id: string;

  @EsField({
    type: 'text',
    analyzer: 'nori_analyzer',
    fields: { raw: { type: 'keyword' } },
  })
  name: string;

  @EsField({ type: 'text', analyzer: 'nori_analyzer' })
  description: string;

  @EsField({ type: 'keyword' })
  category: string;

  @EsField({ type: 'integer' })
  price: number;

  @EsField({ type: 'integer' })
  stock: number;

  @EsField({ type: 'date' })
  createdAt: Date;
}
