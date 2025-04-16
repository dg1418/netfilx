import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';

@Controller('movies')
@UseInterceptors(ClassSerializerInterceptor)
// @Exclude() 적용(class-transform적용하겠다.)할려면 이 인터셉터를 걸어줘야한다.
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @Public()
  getMovies(@Query('title', MovieTitleValidationPipe) title?: string) {
    return this.moviesService.findManyMovies(title);
  }

  @Get(':id')
  @Public()
  getMovie(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.moviesService.findMovieById(+id);
  }

  @Post()
  @RBAC(Role.admin)
  postMovie(@Body() body: CreateMovieDto) {
    return this.moviesService.createMovie(body);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.moviesService.updateMovie(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.deleteMovie(+id);
  }
}
