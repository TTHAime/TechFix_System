import { IsNotEmpty, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @Sanitize()
  declare name: string;

  @IsString()
  @IsNotEmpty()
  @Sanitize()
  declare location: string;
}
