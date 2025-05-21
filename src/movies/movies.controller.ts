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
  UploadedFiles,
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
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';

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
  @UseInterceptors(
    FileInterceptor('movie', {
      limits: {
        fileSize: 200000000, // 200mb
      },
      fileFilter(req, file, callback) {
        const canUploadFile = true;

        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('.mp4 타입의 파일만 가능합니다.'),
            !canUploadFile,
          );
        }

        return callback(null, canUploadFile);
      },
    }),
  )
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req,
    @UploadedFile(
      new MovieFilePipe({
        maxSizeInMB: 200,
        mimetype: 'video/mp4',
      }),
    )
    movieFile: Express.Multer.File,
  ) {
    console.log('--------------------------');
    console.log(movieFile);
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
