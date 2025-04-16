import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddelware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      next();
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);

      const decodedPayload = this.jwtService.decode(token);
      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new UnauthorizedException('잘못된 토큰 입니다!');
      }

      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      req.user = payload;
      next();
    } catch (e) {
      // 이부분도 이상한게 try에서 일부로 잡은 BadRequestException을 UnauthorizedException로 변경하는
      // 로직이 되어버렸음.
      // 아주 개인적인 추가 생각으로는 토큰 만료도 있지만, 토큰 변조도 잡을 수 있는데 퉁친게 아쉬운거 같음
      // throw new UnauthorizedException('Access 토큰이 만료 되었습니다.');

      // 현재 모든 에러가 생기면 일단 next()로 보내는 코드가 되었는데, 왜 이렇게 했을까 생각해봤는데
      // 강의 주제랑 멀아지니까 대충 한듯
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
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    return token;
  }
}
