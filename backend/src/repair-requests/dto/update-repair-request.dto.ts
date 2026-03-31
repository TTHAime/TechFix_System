import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';

export class UpdateRepairRequestDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  declare statusId?: number;

  @IsOptional()
  @IsDateString()
  declare completedAt?: string;
}
