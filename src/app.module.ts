import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EsKitModule } from 'nestjs-es-kit';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, elasticsearchConfig, validationSchema } from './config';

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
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
