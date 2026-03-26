import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class LoginDto {
  @Sanitize()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(100)
  declare email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare password: string;
}
