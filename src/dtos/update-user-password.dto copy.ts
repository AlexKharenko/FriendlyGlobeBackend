import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(18)
  password: string;
}
