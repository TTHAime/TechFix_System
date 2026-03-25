import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';
import { IsStrongPassword } from 'src/common/validators/is-strong-password.validator';

export class HRUpdateUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  @Sanitize()
  name?: string;

  @IsInt()
  @IsOptional()
  deptId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsStrongPassword()
  @IsOptional()
  password?: string;
}
