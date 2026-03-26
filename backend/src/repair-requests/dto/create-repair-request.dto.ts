import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RequestEquipmentDto } from './request-equipment.dto';
import { Transform, Type } from 'class-transformer';
import sanitize from 'sanitize-html';

export class CreateRepairRequestDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) =>
    sanitize(value, { allowedTags: [], allowedAttributes: {} }),
  )
  declare description: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequestEquipmentDto)
  declare equipments: RequestEquipmentDto[];
}
