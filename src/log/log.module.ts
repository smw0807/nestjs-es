import { Module } from '@nestjs/common';
import { EsKitModule } from 'nestjs-es-kit';
import { AppLog } from './log.schema';
import { LogController } from './log.controller';
import { LogService } from './log.service';

@Module({
  imports: [EsKitModule.forFeature([AppLog])],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
