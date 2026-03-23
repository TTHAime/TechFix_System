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

export class CreateUserDto {
  @IsString()
  @MaxLength(100)
  declare name: string;

  @IsEmail()
  declare email: string;

  @IsInt()
  declare roleId: number;

  @IsInt()
  declare deptId: number;

  @IsEnum(AuthProvider)
  declare provider: AuthProvider;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  providerUid?: string;

  @IsStrongPassword()
  @IsOptional()
  password?: string;
}
