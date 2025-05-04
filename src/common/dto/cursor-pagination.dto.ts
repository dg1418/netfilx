import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  //@IsInt()
  //@IsPositive()
  readonly cursor?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  readonly take?: number = 5;

  //@IsOptional()
  @IsString({
    each: true,
  })
  @IsArray()
  readonly orders?: string[] = [];
}
