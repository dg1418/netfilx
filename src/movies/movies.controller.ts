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
  Version,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMovieDto } from './dtos/get-movies.dto';
import { TransectionInterceptor } from 'src/common/interceptor/transection.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/Throttle.decorator';

@Controller({
  path: 'movies',
  version: '1',
})
@UseInterceptors(ClassSerializerInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @Throttle({ count: 3, unit: 'minute' })
  @Public()
  @Version('2')
  getMovies(@Query() query: GetMovieDto) {
    return this.moviesService.findManyMovies(query);
  }

  @Get('recent')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3000)
  getRecentMovies() {
    return this.moviesService.findRecent();
  }

  @Get(':id')
  @Public()
  getMovie(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.moviesService.findMovieById(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransectionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.moviesService.createMovie(body, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.moviesService.updateMovie(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.deleteMovie(id);
  }
}
