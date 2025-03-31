import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
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
    private readonly dataSource: DataSource, // tpyeorm의 트랜잭셕을 위한 객체
  ) {}

  async findManyMovies(title: string) {
    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    return await qb.getManyAndCount();

    // if (!title) {
    //   return this.movieRepository.findAndCount({
    //     relations: ['director', 'genres'],
    //   });
    // }
    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director', 'genres'],
    // });
  }

  async findMovieById(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

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
    // 8강 트랜젝션 시작.
    // 1. 먼저 쿼리러너를 만든다.
    const qr = this.dataSource.createQueryRunner();
    await qr.connect(); // 2. 디비와 러너를 연결하기
    await qr.startTransaction(); // 3. 스타트 트랜젝션, 아규먼트로 트랜젝션 레벨이 문자열로 들어감, 안넣으면 기본세팅

    // 4. try catch 를 트랜젝션에서는 반드시 해야한다. finally까지 해줌
    try {
      // 8. 각각의 리포지토리로 디비를 실행하는게 아니라. 하나의 트랜젝션 객체로 실행해야함.
      const { directorId, genreIds } = createMovieDto;

      const director = await qr.manager.findOne(Director, {
        where: { id: directorId },
      });

      if (!director) {
        throw new NotFoundException(`찾을 수 없는 감독입니다. ${directorId}`);
      }

      const genres = await qr.manager.find(Genre, {
        //여러개를 찾으니까 find
        where: { id: In(genreIds) }, // id 검색을 할때, 한꺼번에 찾기 in()
      });

      if (genres.length !== genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다. 존재하는 ids: ${genres.map((genre) => genre.id).join(',')}`,
        ); //신기방기 새로움
      }

      // 요기부터 쿼리빌더 실습
      const movieDetail = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(MovieDetail)
        .values({
          detail: createMovieDto.detail,
        })
        .execute(); //이걸로 실행

      const movieDetailId = movieDetail.identifiers[0].id; //identifiers는 리스트임. 왜냐면 insert로 여러개를 추가했을 수도 있으니까

      const movie = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(Movie)
        .values({
          title: createMovieDto.title,
          detail: {
            id: movieDetailId, // id를 넣어주는걸 기억. 테이블과 똑같은거 같음
          },
          director, // genres 같은 many to many는 그냥 insert로 추가 안됨. 따로 해야험
        })
        .execute();

      const moiveId = movie.identifiers[0].id;

      await qr.manager
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(moiveId)
        .add(genres.map((genre) => genre.id));

      // 현재 repository에서는 cascade로 연관된 테이블의 정보를 movieRepo에서 생성할 수 있다.
      // 그런데 쿼리 빌더에서는 이 기능을 제공하지 않는다.
      // 결과적으로 쿼리 빌더를 사용할때, 여러 테이블에 row를 생성 할려면 각 repo마다 따로 생성해 줘야한다.
      // return this.movieRepository.save({
      //   title: createMovieDto.title,
      //   detail: {
      //     detail: createMovieDto.detail,
      //   },
      //   director,
      //   genres,
      // });

      // 5. 잘 작동이 끝나면 커밋을 해야겠지?
      await qr.commitTransaction();

      return await this.findMovieById(moiveId);
    } catch (e) {
      // 6. 만일 에러가 일어난다면, 롤백을 해줘야함.
      await qr.rollbackTransaction();
      throw e;
    } finally {
      // 7. 커밋을 했든 에러가 났든 코드가 끝나면 반드시 트랜젝션을 디비에 되돌려줘야함. 아니면 계속 연결중인듯함
      await qr.release();
    }
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
          //여러개를 찾으니까 find
          where: { id: In(genreIds) }, // id 검색을 할때, 한꺼번에 찾기 in()
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids: ${genres.map((genre) => genre.id).join(',')}`,
          ); //신기방기 새로움
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

        // await this.movieDetailRepository.update(
        //   { id: movie.detail.id },
        //   { detail },
        // );
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

      // await this.movieRepository.update(
      //   { id },
      //   {
      //     ...movieRest,
      //     ...(updateDirector && { director: updateDirector }),
      //     //...(updateGenres && { genres: updateGenres }),
      //     // 주석처리된 코드는 작동하지 않음. 에러
      //     // 1. 의도. movie가 가지고 있는 genre 배열을 업데이트.
      //     // 2. 에러. many to many는 가운데 테이블 끼고 저장하잖아? 근데 update 메서드가 이걸 못해줌
      //     // 3. 결과적으로 위 주석은 에러가남.
      //     // 4. 해결 법은 업데이트 후 따로 genre를 바꿔주고. save해줘야함.
      //   },
      // );

      // genres 업데이트를 위한 save 로직

      if (updateGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres') // 관계있는 필드
          .of(id)
          .addAndRemove(
            updateGenres.map((genre) => genre.id), //이건 새로운 장르 관계 추가를 위한 id 리스트
            movie.genres.map((genre) => genre.id), //이건 기존 장르 관계 삭제를 위한 id 리스트
          ); // 관계를 추가하거나 지우는 메서드. 1. 첫번째 파라미터는 추가할값, 두번쨰는 삭제할값
        // 2. many to many 상황에서 기존 관계를 모두 지우고 새롭게 추가된 관계를 넣기위해서 이렇게 함.
      }
      // const newMovie = await this.findMovieById(id);
      // newMovie.genres = updateGenres;

      // await this.movieRepository.save(newMovie);

      await qr.commitTransaction(); // 방금 이거 잊어버렸었음. 잘 기억하기

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
    //await this.movieRepository.delete(movie.id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
