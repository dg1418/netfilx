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
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';

@Controller('movies')
@UseInterceptors(ClassSerializerInterceptor)
// @Exclude() 적용(class-transform적용하겠다.)할려면 이 인터셉터를 걸어줘야한다.
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    return this.moviesService.findManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.moviesService.findMovieById(+id);
  }

  @Post()
  postMovie(@Body() body: CreateMovieDto) {
    return this.moviesService.createMovie(body);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.moviesService.updateMovie(+id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.moviesService.deleteMovie(+id);
  }
}
