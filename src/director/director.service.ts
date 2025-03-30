import { Injectable } from '@nestjs/common';
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

  async findOne(id: number) {
    return this.directorRepository.findOne({
      where: { id },
    });
  }

  async create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    await this.findOne(id);
    await this.directorRepository.update({ id }, updateDirectorDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.directorRepository.delete(id);

    return id;
  }
}
