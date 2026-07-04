import { EsIndex, EsField, koreanAnalysis } from 'nestjs-es-kit';
import { ES9_STOPTAGS } from '../common/nori.constants';

@EsIndex({
  name: 'app-logs',
  settings: {
    numberOfShards: 1,
    numberOfReplicas: 0,
    analysis: koreanAnalysis({ stoptags: ES9_STOPTAGS }),
  },
})
export class AppLog {
  @EsField({ type: 'keyword' })
  level: string;

  @EsField({ type: 'keyword' })
  service: string;

  // raw: 동일 메시지 집계용(Top N), 본문은 nori로 한국어 검색
  @EsField({
    type: 'text',
    analyzer: 'nori_analyzer',
    fields: { raw: { type: 'keyword' } },
  })
  message: string;

  @EsField({ type: 'keyword' })
  traceId: string;

  @EsField({ type: 'keyword' })
  method: string;

  @EsField({ type: 'keyword' })
  path: string;

  @EsField({ type: 'integer' })
  statusCode: number;

  @EsField({ type: 'integer' })
  durationMs: number;

  @EsField({ type: 'date' })
  timestamp: Date;
}
