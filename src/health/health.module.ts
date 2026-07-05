import { Module } from '@nestjs/common';
import { TerminusModule, HealthIndicatorService } from '@nestjs/terminus';
import { EsKitModule, EsIndexService } from 'nestjs-es-kit';
import { EsHealthIndicator } from 'nestjs-es-kit/health';
import { Product } from '../product/product.schema';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, EsKitModule.forFeature([Product])],
  controllers: [HealthController],
  providers: [
    {
      // nestjs-es-kit 1.0.0 버그 우회: health 서브패스 번들이 ES_KIT_CLIENT
      // 심볼의 자체 사본을 갖고 있어 @Inject 토큰이 EsKitModule 프로바이더와
      // 일치하지 않는다. EsIndexService.raw 클라이언트로 직접 생성한다.
      provide: EsHealthIndicator,
      useFactory: (
        products: EsIndexService<Product>,
        healthIndicatorService: HealthIndicatorService,
      ) => new EsHealthIndicator(products.raw, healthIndicatorService),
      inject: [`${Product.name}EsIndexService`, HealthIndicatorService],
    },
  ],
})
export class HealthModule {}
