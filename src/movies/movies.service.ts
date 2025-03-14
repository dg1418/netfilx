import { Injectable, NotFoundException } from '@nestjs/common';

export interface Movie {
  id: number;
  title: string;
}

@Injectable()
export class MoviesService {
  private movieCount = 2;
  private movies: Movie[] = [
    {
      id: 1,
      title: '햄릿',
    },
    {
      id: 2,
      title: '아이언맨',
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

  createMovie(createMovieDto: any) {
    const newMovie: Movie = {
      id: this.movieCount++,
      title: createMovieDto.title,
    };

    this.movies.push(newMovie);

    return newMovie;
  }

  updateMovie(id: number, updateMovieDto: any) {
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
