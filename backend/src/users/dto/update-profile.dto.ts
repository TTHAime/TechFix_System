import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsStrongPassword } from 'src/common/validators/is-strong-password.validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsStrongPassword()
  @IsOptional()
  password?: string;
}
