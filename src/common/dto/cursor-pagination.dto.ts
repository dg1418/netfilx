import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  readonly cursor?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  readonly take?: number = 5;

  @IsOptional()
  @IsString({
    each: true,
  })
  @IsArray()
  readonly orders?: string[] = ['id_DESC'];
}
