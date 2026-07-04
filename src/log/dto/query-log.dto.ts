import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { LogLevel } from './ingest-log.dto';

export class LogFilterDto {
  @IsEnum(LogLevel)
  @IsOptional()
  level?: LogLevel;

  @IsString()
  @IsOptional()
  service?: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}

export class SearchLogsDto extends LogFilterDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  size?: number = 20;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}

export enum StatsInterval {
  HOUR = 'hour',
  DAY = 'day',
}

export class LogStatsDto extends LogFilterDto {
  @IsEnum(StatsInterval)
  @IsOptional()
  interval?: StatsInterval = StatsInterval.HOUR;
}

export class TopErrorsDto extends LogFilterDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  size?: number = 10;
}
