import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
  ) {}

  async findManyMovies(title: string) {
    if (!title) {
      return this.movieRepository.findAndCount();
    }
    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
    });
  }

  async findMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException(`찾는 영화가 없습니다. ${id}`);
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const newMovieDetail = await this.movieDetailRepository.save({
      detail: createMovieDto.detail,
    });

    return this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: newMovieDetail,
    });
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const { detail, ...movieRest } = updateMovieDto;

    const movie = await this.findMovieById(id);

    await this.movieRepository.update({ id }, movieRest);

    if (detail) {
      await this.movieDetailRepository.update(
        { id: movie.detail.id },
        { detail },
      );
    }

    return this.findMovieById(id);
  }

  async deleteMovie(id: number) {
    const movie = await this.findMovieById(id);

    await this.movieRepository.delete(movie.id);
    await this.movieRepository.delete(movie.detail.id);

    return id;
  }
}
