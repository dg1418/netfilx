import { Injectable } from '@nestjs/common';

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

  findManyMovies() {
    return this.movies;
  }

  findMovie(id: number) {
    return this.movies.find((movie) => movie.id === id);
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
    // const newMovie: Movie = {
    //   id: this.movieCount++,
    //   title: updateMovieDto.title,
    // };
    // this.movies.push(newMovie);
    // return newMovie;
  }

  deleteMovie(id: number) {
    return `This action removes a #${id} movie`;
  }
}
