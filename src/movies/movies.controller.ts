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
  Request,
  UploadedFile,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMovieDto } from './dtos/get-movies.dto';
import { TransectionInterceptor } from 'src/common/interceptor/transection.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('movies')
@UseInterceptors(ClassSerializerInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @Public()
  getMovies(@Query() query: GetMovieDto) {
    return this.moviesService.findManyMovies(query);
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
  @UseInterceptors(TransectionInterceptor)
  @UseInterceptors(FileInterceptor('movie'))
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(file);
    return this.moviesService.createMovie(body, req.queryRunner);
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
