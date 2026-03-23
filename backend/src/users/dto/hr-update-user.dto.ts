import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class HRUpdateUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  deptId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @MinLength(15)
  @MaxLength(64)
  @IsOptional()
  password?: string;
}
