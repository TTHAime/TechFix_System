import { IsInt, IsPositive } from 'class-validator';

export class AssignTechnicianDto {
  @IsInt()
  @IsPositive()
  declare technicianId: number;
}
