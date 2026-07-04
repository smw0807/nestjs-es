import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 벌크 색인 엔드포인트가 큰 페이로드를 받으므로 기본 100kb 제한을 늘린다
  app.use(json({ limit: '10mb' }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
}
void bootstrap();
