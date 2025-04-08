import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // 사용자를 생성할꺼니까
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  parseBasicToken(rawToken: string) {
    // 1. 베이직 토큰을 ' ' 기준으로 스플릿 한후 토큰만 추출하기
    const basicSplit = rawToken.split(' ');

    // ["basic", $token]
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

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

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const bearerSplit = rawToken.split(' ');

    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [bearer, token] = bearerSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    try {
      // payload를 가져오면서 검증도 함.
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          envVariableKeys.refreshTokenSecret,
        ), // 이부분 에러남 수정해야함
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해주세요!');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요!');
        }
      }

      return payload;
    } catch (e) {
      throw new UnauthorizedException('Access 토큰이 만료 되었습니다.');
    }
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
      this.configService.get<number>(envVariableKeys.hashRounds),
    );

    await this.userRepository.save({
      email,
      password: hash, // 바로 비번 넣으면 절대 안됨. 항상 해쉬된 값을 넣기
    });

    return this.userRepository.findOne({
      where: { email },
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보 입니다.');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보 입니다.');
    }

    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );

    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    );

    return this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 300,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
