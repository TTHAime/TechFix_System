import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthProvider } from 'src/common/enums/auth-provider.enum';

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

  @IsString()
  @MinLength(15)
  @MaxLength(64)
  @IsOptional()
  password?: string;
}
