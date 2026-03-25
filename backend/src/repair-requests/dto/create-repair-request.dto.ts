import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RequestEquipmentDto } from './request-equipment.dto';
import { Type } from 'class-transformer';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class CreateRepairRequestDto {
  @IsString()
  @IsNotEmpty()
  @Sanitize()
  declare description: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequestEquipmentDto)
  declare equipments: RequestEquipmentDto[];
}
