import { IsOptional, IsString } from 'class-validator';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';

export class GetMovieDto extends PagePaginationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
