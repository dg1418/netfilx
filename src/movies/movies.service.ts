import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMovieDto } from './dtos/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';

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
    private readonly dataSource: DataSource, // tpyeorm의 트랜잭셕을 위한 객체
    private readonly commonService: CommonService,
  ) {}

  async findManyMovies(query: GetMovieDto) {
    const { title } = query;

    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, query);

    const [contents, count] = await qb.getManyAndCount();

    return {
      contents,
      nextCursor,
      count,
    };
  }

  async findMovieById(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();

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
      where: { id: In(ids) }, // id 검색을 할때, 한꺼번에 찾기 in()
    });

    if (genres.length !== ids.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids: ${genres.map((genre) => genre.id).join(',')}`,
      ); //신기방기 새로움
    }

    return genres;
  }

  async createMovie(
    createMovieDto: CreateMovieDto,
    movieFileName: string,
    qr: QueryRunner,
  ) {
    const { directorId, genreIds } = createMovieDto;

    const director = await qr.manager.findOne(Director, {
      where: { id: directorId },
    });

    if (!director) {
      throw new NotFoundException(`찾을 수 없는 감독입니다. ${directorId}`);
    }

    const genres = await qr.manager.find(Genre, {
      where: { id: In(genreIds) },
    });

    if (genres.length !== genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids: ${genres.map((genre) => genre.id).join(',')}`,
      ); //신기방기 새로움
    }

    const movieDetail = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;
    const movieFilePath = join('public', 'movie');

    const movie = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        director,
        movieFilePath: join(movieFilePath, movieFileName),
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    await qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));

    return await qr.manager.findOne(Movie, {
      where: { id: movieId },
      relations: ['genres', 'director', 'detail'],
    });
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect(); // 2. 디비와 러너를 연결하기
    await qr.startTransaction();

    try {
      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
      let updateDirector: Director | null = null;
      let updateGenres: Genre[] | null = null;

      const movie = await this.findMovieById(id); // 변경해야함

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: { id: In(genreIds) },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids: ${genres.map((genre) => genre.id).join(',')}`,
          );
        }

        updateGenres = genres;
      }

      if (detail) {
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
      }

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException(`찾을 수 없는 감독입니다. ${directorId}`);
        }

        updateDirector = director;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(updateDirector && { director: updateDirector }),
      };

      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      if (updateGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(
            updateGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }

      await qr.commitTransaction();

      return await this.findMovieById(id);
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async deleteMovie(id: number) {
    const movie = await this.findMovieById(id);

    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
