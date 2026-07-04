import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export class LogEntryDto {
  @IsEnum(LogLevel)
  level: LogLevel;

  @IsString()
  @IsNotEmpty()
  service: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  traceId?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  statusCode?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  durationMs?: number;

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}

export class IngestLogsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogEntryDto)
  logs: LogEntryDto[];
}
