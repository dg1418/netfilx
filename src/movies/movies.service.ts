import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
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
        relations: ['director', 'genres'],
      });
    }
    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
      relations: ['director', 'genres'],
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
      ); //신기방기 새로움
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
    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
    const movie = await this.findMovieById(id);
    let updateDirector: Director | null = null;
    let updateGenres: Genre[] | null = null;

    if (genreIds) {
      const genres = await this.findGenresByIds(genreIds);
      updateGenres = genres;
    }

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
        //...(updateGenres && { genres: updateGenres }),
        // 주석처리된 코드는 작동하지 않음. 에러
        // 1. 의도. movie가 가지고 있는 genre 배열을 업데이트.
        // 2. 에러. many to many는 가운데 테이블 끼고 저장하잖아? 근데 update 메서드가 이걸 못해줌
        // 3. 결과적으로 위 주석은 에러가남.
        // 4. 해결 법은 업데이트 후 따로 genre를 바꿔주고. save해줘야함.
      },
    );

    // genres 업데이트를 위한 save 로직
    const newMovie = await this.findMovieById(id);
    newMovie.genres = updateGenres;

    await this.movieRepository.save(newMovie);

    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.findMovieById(id);

    await this.movieRepository.delete(movie.id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
