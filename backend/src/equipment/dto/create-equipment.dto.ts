import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  @Sanitize()
  declare name: string;

  @IsString()
  @IsNotEmpty()
  @Sanitize()
  declare serialNo: string;

  @IsInt()
  @IsPositive()
  declare categoryId: number;

  @IsInt()
  @IsPositive()
  declare deptId: number;
}
