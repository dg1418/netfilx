import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // 사용자를 생성할꺼니까
    private readonly configService: ConfigService,
  ) {}
  parseBasicToken(rawToken: string) {
    // 1. 베이직 토큰을 ' ' 기준으로 스플릿 한후 토큰만 추출하기
    const basicSplit = rawToken.split(' ');

    // ["basic", $token]
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [_, token] = basicSplit;

    // 2. 추출한 토큰을 base64로 인코딩 한 후 이메일:비밀번호 를 나누기
    const decoded = Buffer.from(token, 'base64').toString('utf-8'); // 그냥 외우기

    const tokenSplit = decoded.split(':');

    // ["email", "password"]
    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [email, password] = tokenSplit;

    return {
      email,
      password,
    };
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    // 1. 회원가입 하는 이메일이 이미 가입한 이메일은 아닌지 확인
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다.');
    }

    // 3. 비번 해쉬를 위해 bcrypt 사용
    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS'),
    );

    await this.userRepository.save({
      email,
      password: hash, // 바로 비번 넣으면 절대 안됨. 항상 해쉬된 값을 넣기
    });

    return this.userRepository.findOne({
      where: { email },
    });
  }
}
