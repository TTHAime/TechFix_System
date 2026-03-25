import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class UpdateRepairRequestDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  declare statusId?: number;

  @IsOptional()
  @IsString()
  @Sanitize()
  declare partsUsed?: string;

  @IsOptional()
  @IsString()
  @Sanitize()
  declare repairSummary?: string;

  @IsOptional()
  @IsDateString()
  declare completedAt?: string;
}
