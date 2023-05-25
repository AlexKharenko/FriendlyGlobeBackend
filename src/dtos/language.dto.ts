import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LanguageDto {
  @IsNotEmpty()
  @IsNumber()
  languageId: number;

  @IsNotEmpty()
  @IsString()
  language: string;
}
