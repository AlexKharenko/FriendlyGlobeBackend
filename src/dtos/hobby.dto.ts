import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class HobbyDto {
  @IsNotEmpty()
  @IsNumber()
  hobbyId: number;

  @IsNotEmpty()
  @IsString()
  hobby: string;
}
