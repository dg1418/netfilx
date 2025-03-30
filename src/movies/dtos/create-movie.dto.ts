import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsArray() //배열임
  @ArrayNotEmpty() //비어있자 않은 배열이다.
  @IsInt({ each: true })
  @IsPositive({ each: true })
  genreIds: number[];

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  directorId: number;
}
