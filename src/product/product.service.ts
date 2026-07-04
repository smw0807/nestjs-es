import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectIndex, EsIndexService } from 'nestjs-es-kit';
import { Product } from './product.schema';
import {
  BulkCreateProductDto,
  CreateProductDto,
} from './dto/create-product.dto';
import {
  CursorSearchProductDto,
  SearchProductDto,
} from './dto/search-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectIndex(Product) private readonly products: EsIndexService<Product>,
  ) {}

  async create(dto: CreateProductDto) {
    const doc: Product = {
      ...dto,
      description: dto.description ?? '',
      createdAt: new Date(),
    };
    const id = await this.products.index(doc, {
      id: doc.id,
      refresh: 'wait_for',
    });
    return { id };
  }

  async bulkCreate(dto: BulkCreateProductDto) {
    const now = new Date();
    const docs: Product[] = dto.products.map((p) => ({
      ...p,
      description: p.description ?? '',
      createdAt: now,
    }));
    const result = await this.products.bulkIndex(docs, {
      idSelector: (doc) => doc.id,
      refresh: 'wait_for',
    });
    return {
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed.map((f) => ({ id: f.doc.id, status: f.status })),
    };
  }

  async findById(id: string) {
    const product = await this.products.get(id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.products.delete(id, { refresh: 'wait_for' });
    return { deleted: true };
  }

  async search(dto: SearchProductDto) {
    const result = await this.products.search({
      query: this.buildQuery(dto),
      sort: dto.keyword ? undefined : [{ createdAt: 'desc' }],
      size: dto.size,
      from: dto.from,
    });
    return {
      total: result.total,
      items: result.hits,
    };
  }

  async facets(dto: SearchProductDto) {
    const aggs = await this.products.aggregate(
      {
        byCategory: { terms: { field: 'category', size: 20 } },
        priceRanges: {
          range: {
            field: 'price',
            ranges: [
              { key: '~1만원', to: 10000 },
              { key: '1~10만원', from: 10000, to: 100000 },
              { key: '10~100만원', from: 100000, to: 1000000 },
              { key: '100만원~', from: 1000000 },
            ],
          },
        },
        avgPrice: { avg: { field: 'price' } },
      },
      { query: this.buildQuery(dto) },
    );

    // v1.0.0부터 집계 정의로부터 응답 타입이 자동 추론된다
    return {
      categories: aggs.byCategory.buckets.map((b) => ({
        category: b.key,
        count: b.doc_count,
      })),
      priceRanges: aggs.priceRanges.buckets.map((b) => ({
        range: b.key,
        count: b.doc_count,
      })),
      avgPrice: aggs.avgPrice.value,
    };
  }

  async cursorSearch(dto: CursorSearchProductDto) {
    const result = await this.products.searchAfter({
      query: dto.keyword ? { match: { name: dto.keyword } } : { match_all: {} },
      sort: [{ createdAt: 'desc' }, { id: 'asc' }],
      size: dto.size,
      after: this.decodeCursor(dto.cursor),
    });
    return {
      total: result.total,
      items: result.hits,
      nextCursor: this.encodeCursor(result.nextCursor),
    };
  }

  private buildQuery(dto: SearchProductDto): Record<string, unknown> {
    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];

    if (dto.keyword) {
      must.push({
        multi_match: {
          query: dto.keyword,
          fields: ['name^2', 'description'],
        },
      });
    }
    if (dto.category) {
      filter.push({ term: { category: dto.category } });
    }
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      filter.push({
        range: {
          price: {
            ...(dto.minPrice !== undefined && { gte: dto.minPrice }),
            ...(dto.maxPrice !== undefined && { lte: dto.maxPrice }),
          },
        },
      });
    }

    if (must.length === 0 && filter.length === 0) {
      return { match_all: {} };
    }
    return { bool: { must, filter } };
  }

  private encodeCursor(cursor?: readonly unknown[]): string | null {
    if (!cursor) return null;
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  private decodeCursor(cursor?: string): unknown[] | undefined {
    if (!cursor) return undefined;
    return JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as unknown[];
  }
}
