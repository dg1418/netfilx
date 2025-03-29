import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGenreDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name?: string;
}
