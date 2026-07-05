import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EsKitModule } from 'nestjs-es-kit';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, elasticsearchConfig, validationSchema } from './config';
import { ProductModule } from './product/product.module';
import { LogModule } from './log/log.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, elasticsearchConfig],
      validationSchema,
    }),
    EsKitModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        node: config.getOrThrow<string>('elasticsearch.node'),
        auth: {
          username: config.getOrThrow<string>('elasticsearch.username'),
          password: config.getOrThrow<string>('elasticsearch.password'),
        },
        synchronize: config.get<'none' | 'create' | 'sync'>(
          'elasticsearch.sync',
          'create',
        ),
        // 로컬 ES의 자체 서명 인증서 허용 (개발 환경 전용)
        ...(config.get('app.nodeEnv') === 'development' && {
          tls: { rejectUnauthorized: false },
        }),
      }),
      inject: [ConfigService],
    }),
    ProductModule,
    LogModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
