import { IsOptional, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class ResolveItemDto {
  @IsOptional()
  @IsString()
  @Sanitize()
  declare note?: string;
}
