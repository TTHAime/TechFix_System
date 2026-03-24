import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @IsString()
  @IsNotEmpty()
  declare serialNo: string;

  @IsInt()
  @IsPositive()
  declare categoryId: number;

  @IsInt()
  @IsPositive()
  declare deptId: number;
}
