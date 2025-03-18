import { IsNotEmpty } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty() //비어있을 수 없다.
  title: string;

  @IsNotEmpty()
  genre: string;
}
