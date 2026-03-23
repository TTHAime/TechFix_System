import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuthProvider } from 'src/common/enums/auth-provider.enum';
import { IsStrongPassword } from 'src/common/validators/is-strong-password.validator';

export class HRCreateUserDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  deptId: number;

  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @IsStrongPassword()
  @IsOptional()
  password?: string;
}
