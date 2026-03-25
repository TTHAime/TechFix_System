import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateRepairRequestDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  declare statusId?: number;

  @IsOptional()
  @IsString()
  declare partsUsed?: string;

  @IsOptional()
  @IsString()
  declare repairSummary?: string;

  @IsOptional()
  @IsDateString()
  declare completedAt?: string;
}
