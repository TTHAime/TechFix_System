import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsInt()
  @IsOptional()
  roleId?: number;

  @IsInt()
  @IsOptional()
  deptId?: number;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
