import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  readonly id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  readonly take?: number = 5;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  readonly order?: 'ASC' | 'DESC' = 'DESC';
}
