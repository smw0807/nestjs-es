import { Injectable } from '@nestjs/common';
import {
  InjectIndex,
  EsIndexService,
  type TermsBucket,
  type DateHistogramBucket,
} from 'nestjs-es-kit';
import { AppLog } from './log.schema';
import { IngestLogsDto, LogLevel } from './dto/ingest-log.dto';
import {
  LogFilterDto,
  LogStatsDto,
  SearchLogsDto,
  StatsInterval,
  TopErrorsDto,
} from './dto/query-log.dto';

// 라이브러리가 추론하지 못하는 하위 집계(sub-aggregation) 필드만 확장한다
interface StatsBucket extends DateHistogramBucket {
  byLevel: { buckets: TermsBucket[] };
}

interface ServiceBucket extends TermsBucket {
  avgDuration: { value: number | null };
  p95Duration: { values: Record<string, number | null> };
  errors: { doc_count: number };
}

@Injectable()
export class LogService {
  constructor(
    @InjectIndex(AppLog) private readonly logs: EsIndexService<AppLog>,
  ) {}

  async ingest(dto: IngestLogsDto) {
    const docs: AppLog[] = dto.logs.map((entry) => ({
      ...entry,
      traceId: entry.traceId ?? '',
      method: entry.method ?? '',
      path: entry.path ?? '',
      statusCode: entry.statusCode ?? 0,
      durationMs: entry.durationMs ?? 0,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    }));
    // 로그는 즉시 조회가 필요 없어 refresh를 기다리지 않는다
    const result = await this.logs.bulkIndex(docs, { refresh: false });
    return {
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed.length,
    };
  }

  async search(dto: SearchLogsDto) {
    const result = await this.logs.search({
      query: this.buildQuery(dto, dto.keyword),
      sort: [{ timestamp: 'desc' }],
      size: dto.size,
      from: dto.offset,
    });
    return { total: result.total, items: result.hits };
  }

  /** 시간대별 로그 건수 + 레벨별 분포 (date_histogram) */
  async stats(dto: LogStatsDto) {
    const aggs = await this.logs.aggregate(
      {
        overTime: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval:
              dto.interval === StatsInterval.DAY ? 'day' : 'hour',
            min_doc_count: 0,
          },
          aggs: {
            byLevel: { terms: { field: 'level', size: 10 } },
          },
        },
      },
      { query: this.buildQuery(dto) },
    );

    const buckets = aggs.overTime.buckets as StatsBucket[];
    return {
      interval: dto.interval,
      buckets: buckets.map((b) => ({
        time: b.key_as_string,
        count: b.doc_count,
        levels: Object.fromEntries(
          b.byLevel.buckets.map((l) => [l.key, l.doc_count]),
        ),
      })),
    };
  }

  /** error/fatal 로그에서 동일 메시지 Top N */
  async topErrors(dto: TopErrorsDto) {
    const query = this.buildQuery(dto);
    const bool = query.bool as { filter: Record<string, unknown>[] };
    if (!dto.level) {
      bool.filter.push({
        terms: { level: [LogLevel.ERROR, LogLevel.FATAL] },
      });
    }

    const aggs = await this.logs.aggregate(
      {
        topMessages: {
          terms: { field: 'message.raw', size: dto.size },
        },
      },
      { query },
    );

    return {
      items: aggs.topMessages.buckets.map((b) => ({
        message: b.key,
        count: b.doc_count,
      })),
    };
  }

  /** 서비스별 트래픽·응답시간·에러율 요약 */
  async serviceSummary(dto: LogFilterDto) {
    const aggs = await this.logs.aggregate(
      {
        byService: {
          terms: { field: 'service', size: 20 },
          aggs: {
            avgDuration: { avg: { field: 'durationMs' } },
            p95Duration: {
              percentiles: { field: 'durationMs', percents: [95] },
            },
            errors: {
              filter: {
                terms: { level: [LogLevel.ERROR, LogLevel.FATAL] },
              },
            },
          },
        },
      },
      { query: this.buildQuery(dto) },
    );

    const buckets = aggs.byService.buckets as ServiceBucket[];
    return {
      services: buckets.map((b) => ({
        service: b.key,
        count: b.doc_count,
        avgDurationMs: b.avgDuration.value
          ? Math.round(b.avgDuration.value)
          : null,
        p95DurationMs: b.p95Duration.values['95.0'] ?? null,
        errorCount: b.errors.doc_count,
        errorRate: Number((b.errors.doc_count / b.doc_count).toFixed(4)),
      })),
    };
  }

  private buildQuery(
    dto: LogFilterDto,
    keyword?: string,
  ): Record<string, unknown> {
    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];

    if (keyword) {
      must.push({ match: { message: keyword } });
    }
    if (dto.level) {
      filter.push({ term: { level: dto.level } });
    }
    if (dto.service) {
      filter.push({ term: { service: dto.service } });
    }
    if (dto.from || dto.to) {
      filter.push({
        range: {
          timestamp: {
            ...(dto.from && { gte: dto.from }),
            ...(dto.to && { lte: dto.to }),
          },
        },
      });
    }

    return { bool: { must, filter } };
  }
}
