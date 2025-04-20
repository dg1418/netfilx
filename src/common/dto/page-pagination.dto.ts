import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PagePaginationDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @IsPositive()
  @IsOptional()
  take?: number = 5;
}
