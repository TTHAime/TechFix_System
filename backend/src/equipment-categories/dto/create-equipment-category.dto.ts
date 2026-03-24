import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEquipmentCategoryDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;
}
