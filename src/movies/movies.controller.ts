import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  getMovies() {
    return this.moviesService.findManyMovies();
  }

  @Get()
  getMovie(@Param('id') id: string) {
    return this.moviesService.findMovie(+id);
  }

  @Post()
  postMovie(@Body() createMovieDto: any) {
    return this.moviesService.createMovie(createMovieDto);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() updateMovieDto: any) {
    return this.moviesService.updateMovie(+id, updateMovieDto);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.moviesService.deleteMovie(+id);
  }
}
