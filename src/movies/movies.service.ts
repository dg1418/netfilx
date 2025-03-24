import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MoviesService {
  private movieCount = 2;
  private movies: Movie[] = [];
  constructor() {
    const movie1 = new Movie();
    movie1.id = 1;
    movie1.title = '햄릿';
    movie1.genre = 'fantasy';

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = '아이언맨';
    movie2.genre = 'action';

    this.movies.push(movie1, movie2);
  }

  findManyMovies(title: string) {
    if (!title) {
      return this.movies;
    }

    return this.movies.filter((movie) => movie.title.startsWith(title));
  }

  findMovie(id: number) {
    const movie = this.movies.find((movie) => movie.id === id);

    if (!movie) {
      throw new NotFoundException(`찾는 영화가 없습니다. ${id}`);
    }

    return movie;
  }

  createMovie(createMovieDto: CreateMovieDto) {
    const newMovie: Movie = {
      id: ++this.movieCount,
      ...createMovieDto,
    };

    this.movies.push(newMovie);

    return newMovie;
  }

  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.findMovie(id);

    Object.assign(movie, updateMovieDto);

    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((movie) => movie.id === id);

    if (movieIndex === -1) {
      throw new NotFoundException(`찾는 영화가 없습니다. ${id}`);
    }

    this.movies.splice(movieIndex, 1);

    return id;
  }
}
