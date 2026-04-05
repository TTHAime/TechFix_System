import { IsStrongPassword } from 'src/common/validators/is-strong-password.validator';

export class ForceChangePasswordDto {
  @IsStrongPassword()
  declare newPassword: string;
}
