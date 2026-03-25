import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';
import { IsStrongPassword } from 'src/common/validators/is-strong-password.validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  @Sanitize()
  name?: string;

  @IsStrongPassword()
  @IsOptional()
  password?: string;
}
