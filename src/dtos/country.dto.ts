import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CountryDto {
  @IsNotEmpty()
  @IsNumber()
  countryId: number;

  @IsNotEmpty()
  @IsString()
  countryName: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string;
}
