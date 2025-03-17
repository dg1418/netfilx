import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';

export interface Movie {
  id: number;
  title: string;
  genre: string;
}

@Injectable()
export class MoviesService {
  private movieCount = 2;
  private movies: Movie[] = [
    {
      id: 1,
      title: '햄릿',
      genre: '판타지',
    },
    {
      id: 2,
      title: '아이언맨',
      genre: '액션',
    },
  ];

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
