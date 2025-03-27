import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMovieDto {
  @IsNotEmpty() // 값이 비어있을 수 없다.
  @IsString()
  @IsOptional() // title 속성은 있을 수 도 있고 없을 수도 있다. => title이 없을 수 있지만 있다면, 비어있을 수 없음
  title?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  genre?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  detail?: string;
}
