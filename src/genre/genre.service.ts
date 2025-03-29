import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  findAll() {
    return this.genreRepository.findAndCount();
  }

  async findGenreById(id: number) {
    const genre = await this.genreRepository.findOne({
      where: {
        id,
      },
    });

    if (!genre) {
      throw new NotFoundException(`장르를 찾을 수 없습니다. : ${id}`);
    }

    return genre;
  }

  create(createGenreDto: CreateGenreDto) {
    return this.genreRepository.save(createGenreDto);
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    await this.findGenreById(id);
    await this.genreRepository.update({ id }, updateGenreDto);
    return this.findGenreById(id);
  }

  async remove(id: number) {
    const genre = await this.findGenreById(id);
    await this.genreRepository.delete(genre.id);
    return id;
  }
}
