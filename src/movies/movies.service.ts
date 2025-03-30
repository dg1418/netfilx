import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entities/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async findManyMovies(title: string) {
    if (!title) {
      return this.movieRepository.findAndCount({
        relations: ['director'],
      });
    }
    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
      relations: ['director'],
    });
  }

  async findMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director', 'genres'],
    });

    if (!movie) {
      throw new NotFoundException(`찾는 영화가 없습니다. ${id}`);
    }

    return movie;
  }

  async findDirectorById(id: number) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });

    if (!director) {
      throw new NotFoundException(`찾을 수 없는 감독입니다. ${id}`);
    }

    return director;
  }

  async findGenresByIds(ids: number[]) {
    const genres = await this.genreRepository.find({
      //여러개를 찾으니까 find
      where: { id: In(ids) }, // id 검색을 할때, 한꺼번에 찾기 in()
    });

    if (genres.length !== ids.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids: ${genres.map((genre) => genre.id).join(',')}`,
      ); //신기
    }

    return genres;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const { directorId, genreIds } = createMovieDto;
    const director = await this.findDirectorById(directorId);
    const genres = await this.findGenresByIds(genreIds);

    return this.movieRepository.save({
      title: createMovieDto.title,
      detail: {
        detail: createMovieDto.detail,
      },
      director,
      genres,
    });
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const { detail, directorId, ...movieRest } = updateMovieDto;
    const movie = await this.findMovieById(id);
    let updateDirector: Director | null = null;

    if (detail) {
      await this.movieDetailRepository.update(
        { id: movie.detail.id },
        { detail },
      );
    }

    if (directorId) {
      const director = await this.findDirectorById(directorId);
      updateDirector = director;
    }

    await this.movieRepository.update(
      { id },
      {
        ...movieRest,
        ...(updateDirector && { director: updateDirector }),
      },
    );

    return this.findMovieById(id);
  }

  async deleteMovie(id: number) {
    const movie = await this.findMovieById(id);

    await this.movieRepository.delete(movie.id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
