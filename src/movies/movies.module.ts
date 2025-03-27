import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entities/director.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, MovieDetail, Director])],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
