import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { Repository } from 'typeorm';
import { Director } from './entity/director.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}
  async findAll() {
    return this.directorRepository.findAndCount();
  }

  async findOneById(id: number) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });

    if (!director) {
      throw new NotFoundException(`찾을 수 없는 감독입니다. ${id}`);
    }

    return director;
  }

  async create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    await this.findOneById(id);
    await this.directorRepository.update({ id }, updateDirectorDto);
    return this.findOneById(id);
  }

  async remove(id: number) {
    await this.findOneById(id);
    await this.directorRepository.delete(id);

    return id;
  }
}
