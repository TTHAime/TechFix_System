import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class RequestEquipmentDto {
  @IsInt()
  @IsPositive()
  declare equipmentId: number;

  @IsString()
  @IsNotEmpty()
  declare issueDetail: string;
}
