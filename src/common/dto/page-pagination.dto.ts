import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PagePaginationDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  readonly page?: number = 1;

  @IsInt()
  @IsPositive()
  @IsOptional()
  readonly take?: number = 5;
}
