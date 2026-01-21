import {
  BadRequestException,
  Inject,
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
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // 사용자를 생성할꺼니까
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly userService: UserService,
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
      // 개인적으로 이부분 아주 이상하다고 생각하고 있음.
      // isRefreshToken 로 리플레시 토큰을 받을지 엑세스 토큰을 받을지 boolean을 받는데
      // isRefreshToken : true로 하고 막상 rawToken으로 엑세스 토큰을 넣었을때 , 에러제어가 이상함.
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken
            ? envVariableKeys.refreshTokenSecret
            : envVariableKeys.accessTokenSecret,
        ),
      });

      // 이 부분에서 payload의 타입을 보고 isRefreshToken 와 비교해보는데,
      // Secret키가 엑세스와 리플레쉬가 다르면 payload 반환에서 에러가남.
      // 강의에서는 env 키가 둘다 같기 때문에 에러가 안났을 뿐이였음.

      // 13강 강의 이후.
      // 애초에 이 bearer token 검증 로직은 auth service에서 버러지더라.
      // 미들웨어에 이 로직이 가고. 이 메서드는 버려짐.
      // 거기서는 나름 만족할 논리가 잘 적용됨. 예를 들어 디코드를 먼저해서 type을 체크함.
      // 이러면 시크릿키를 먼저 만족시키지 않아도 됨.
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
      // 이부분도 이상한게 try에서 일부로 잡은 BadRequestException을 UnauthorizedException로 변경하는
      // 로직이 되어버렸음.
      // 아주 개인적인 추가 생각으로는 토큰 만료도 있지만, 토큰 변조도 잡을 수 있는데 퉁친게 아쉬운거 같음
      throw new UnauthorizedException('Access 토큰이 만료 되었습니다.');
    }
  }

  async blockToken(token: string) {
    const tokenKey = `BLOCKED_TOKEN_${token}`;
    const payload = await this.jwtService.decode(token);
    const expiryMs = payload['exp'] * 1000;
    const nowMs = Date.now();
    const cacheTTL = expiryMs - nowMs;

    if (cacheTTL > 0) {
      await this.cacheManager.set(tokenKey, payload, cacheTTL);
    }

    return true;
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({
      email,
      password,
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
