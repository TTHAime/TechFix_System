import { IsNotEmpty, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Sanitize()
  declare name: string;
}
