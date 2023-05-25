import { IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateUserHiddenDto {
  @IsBoolean()
  @IsNotEmpty()
  hidden: boolean;
}
