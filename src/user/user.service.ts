import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.findAndCount();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`유저를 찾을 수 없습니다. ${id}`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    return this.userRepository.save(createUserDto);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    await this.userRepository.update({ id }, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.userRepository.delete(id);
    return id;
  }
}
