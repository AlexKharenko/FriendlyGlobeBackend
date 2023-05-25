import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  ValidateNested,
  IsArray,
  IsOptional,
  MinDate,
  MaxDate,
  IsDate,
  ValidateIf,
} from 'class-validator';
import { CountryDto } from './country.dto';
import { LanguageDto } from './language.dto';
import { HobbyDto } from './hobby.dto';
import { maxDate, minDate } from 'src/utils/dateValidation';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  secondName: string;

  @IsDate()
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @MinDate(minDate())
  @MaxDate(maxDate())
  birthdayDate: Date;

  @IsNotEmpty()
  @IsString()
  sexId: string;

  @IsNotEmpty()
  @Type(() => CountryDto)
  @ValidateNested()
  country: CountryDto;

  @IsString()
  @IsNotEmpty()
  @MinLength(100)
  @MaxLength(1000)
  bio: string;

  @IsOptional()
  @ValidateIf((dto) => dto.lookingForText)
  @IsString()
  @MaxLength(1000)
  @MinLength(100)
  lookingForText?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages: LanguageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HobbyDto)
  hobbies: HobbyDto[];
}
