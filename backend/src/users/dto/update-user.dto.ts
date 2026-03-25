import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';
import { IsStrongPassword } from 'src/common/validators/is-strong-password.validator';

export class UpdateUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  @Sanitize()
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

  @IsStrongPassword()
  @IsOptional()
  password?: string;
}
