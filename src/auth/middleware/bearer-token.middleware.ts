import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddelware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    const blockedToken = await this.cacheManager.get(`BLOCKED_TOKEN_${token}`);
    if (blockedToken) {
      throw new UnauthorizedException('차단된 토큰 입니다!');
    }

    const tokenKey = `TOKEN_${token}`;
    const cachedPayload = await this.cacheManager.get(tokenKey);
    if (cachedPayload) {
      req.user = cachedPayload;
      next();
      return;
    }

    const decodedPayload = this.jwtService.decode(token);
    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰 입니다!');
    }

    try {
      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      // 캐싱하기
      const expiryMs = payload['exp'] * 1000;
      const nowMs = Date.now();
      const diffMs = expiryMs - nowMs;

      const cacheSafetyMarginMs = 30000; // 캐시 만료 시간을 토큰만료보다 안전하게 30초 일찍 없애줌
      const cacheTTL = diffMs - cacheSafetyMarginMs;

      if (cacheTTL > 0) {
        await this.cacheManager.set(tokenKey, payload, cacheTTL);
      }

      req.user = payload;
      next();
    } catch (e) {
      // 이부분도 이상한게 try에서 일부로 잡은 BadRequestException을 UnauthorizedException로 변경하는
      // 로직이 되어버렸음.
      // 아주 개인적인 추가 생각으로는 토큰 만료도 있지만, 토큰 변조도 잡을 수 있는데 퉁친게 아쉬운거 같음
      // throw new UnauthorizedException('Access 토큰이 만료 되었습니다.');

      // 현재 모든 에러가 생기면 일단 next()로 보내는 코드가 되었는데, 왜 이렇게 했을까 생각해봤는데
      // 강의 주제랑 멀아지니까 대충 한듯

      // 15강에서 에러 처리 해줬음
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access 토큰이 만료 되었습니다.');
      }

      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const bearerSplit = rawToken.split(' ');

    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [bearer, token] = bearerSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      if (bearer.toLowerCase() === 'basic') {
        this.logger.error(
          'Basic 인증이 들어왔습니다',
          null,
          BearerTokenMiddelware.name,
        );
      }
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    return token;
  }
}
