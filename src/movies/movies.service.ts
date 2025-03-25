import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
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
    });

    if (!movie) {
      throw new NotFoundException(`찾는 영화가 없습니다. ${id}`);
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    return this.movieRepository.save(createMovieDto);
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    await this.findMovieById(id);

    await this.movieRepository.update({ id }, updateMovieDto);

    return this.findMovieById(id);
  }

  async deleteMovie(id: number) {
    await this.findMovieById(id);

    await this.movieRepository.delete(id);

    return id;
  }
}
