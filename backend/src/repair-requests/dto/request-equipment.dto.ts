import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class RequestEquipmentDto {
  @IsInt()
  @IsPositive()
  declare equipmentId: number;

  @IsString()
  @IsNotEmpty()
  @Sanitize()
  declare issueDetail: string;
}
