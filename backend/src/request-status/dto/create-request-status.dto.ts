import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRequestStatusDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;
}
