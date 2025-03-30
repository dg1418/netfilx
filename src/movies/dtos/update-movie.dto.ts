import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsString()
  detail?: string;

  @IsArray() //배열임
  @ArrayNotEmpty() //비어있자 않은 배열이다.
  @IsInt({ each: true })
  //@IsNumber({}, { each: true })
  @IsOptional()
  genreIds?: number[];

  @IsNotEmpty()
  @IsInt()
  @IsOptional()
  directorId?: number;
}
