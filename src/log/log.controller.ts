import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { IngestLogsDto } from './dto/ingest-log.dto';
import {
  LogFilterDto,
  LogStatsDto,
  SearchLogsDto,
  TopErrorsDto,
} from './dto/query-log.dto';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post('bulk')
  ingest(@Body() dto: IngestLogsDto) {
    return this.logService.ingest(dto);
  }

  @Get('search')
  search(@Query() dto: SearchLogsDto) {
    return this.logService.search(dto);
  }

  @Get('stats')
  stats(@Query() dto: LogStatsDto) {
    return this.logService.stats(dto);
  }

  @Get('errors/top')
  topErrors(@Query() dto: TopErrorsDto) {
    return this.logService.topErrors(dto);
  }

  @Get('services')
  serviceSummary(@Query() dto: LogFilterDto) {
    return this.logService.serviceSummary(dto);
  }
}
