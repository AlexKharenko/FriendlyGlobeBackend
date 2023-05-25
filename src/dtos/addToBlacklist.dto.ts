import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddToBlacklistDto {
  @IsNotEmpty()
  @IsNumber()
  blockedUserId: number;
}
