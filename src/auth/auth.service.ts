import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    // 1. 로그인 하는 이메일이 있는지 확인
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // 에러 메시지로 이메일이 없다는걸 알려주지 않음. 잘못되었다는것만 알려줌.
      throw new BadRequestException('잘못된 로그인 정보 입니다.');
    }

    // 2. 비밀번호가 맞는지 확인
    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보 입니다.');
    }

    // 3. env의 시그니처 비번을 가져와서
    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );

    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );

    // 4. 실제 토큰을 생성해서 리턴 해줄꺼임.
    // 5. 토큰을 만들기위해 nestjs/jwt 의 JwtModule을 import받아서 JwtService를 사용할꺼임
    // 6. jwtService 의 signAsync 을 사용함. 비동기로 signing 한다.
    // 7. 첫번째 아규먼트로 payload 정보를 넣어줌
    // 8. 두번째 아규먼트로는 JwtModule.register()에서 넣지 않은 옵션값을 넣어줌.
    /**
     * secret : 이 시그니처 비번으로 sign할꺼임. 정확한 시크릿 넣기
     */
    return {
      refreshToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: refreshTokenSecret, // 시크릿 키와
          expiresIn: '24h', // 토큰 시간을 넣음. 숫자로만 넣으면 초단위, "h"로 시간단위
        },
      ),
      accessToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: accessTokenSecret,
          expiresIn: 300, //300초
        },
      ),
    };
  }
}
