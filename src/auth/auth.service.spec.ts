import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtService = {
  verifyAsync: jest.fn(),
  decode: jest.fn(),
  signAsync: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

const mockUserService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseBasicToken', () => {
    it('basic 토큰을 파싱후 base64 디코드해 리턴합니다.', () => {
      const rawToken = 'basic ZGcxNDE4QG5hdmVyLmNvbTpzZGxzZGZsYWZzajEyMzQ=';
      const decode = {
        email: 'dg1418@naver.com',
        password: 'sdlsdflafsj1234',
      };

      const result = authService.parseBasicToken(rawToken);

      expect(result).toEqual(decode);
    });

    it('basic 토큰 포멧이 잘못되면 BadRequestException 에러를 던집니다.', () => {
      const rawToken = 'basicZGcxNDE4QG5hdmVyLmNvbTpzZGxzZGZsYWZzajEyMzQ=';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('basic 토큰 포멧이 잘못되면 BadRequestException 에러를 던집니다.', () => {
      const rawToken = 'bearer ZGcxNDE4QG5hdmVyLmNvbTpzZGxzZGZsYWZzajEyMzQ=';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('basic 토큰 포멧이 잘못되면 BadRequestException 에러를 던집니다.', () => {
      const rawToken = 'basic sdlsdflafsj1234';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('basic 토큰 포멧이 잘못되면 BadRequestException 에러를 던집니다.', () => {
      const rawToken = 'basic sdlsdflafsj1234';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('parseBearerToken', () => {
    it('bearer 엑세스토큰을 받아 파싱해 리턴합니다.', async () => {
      const rawToken = 'bearer token';
      const isRefreshToken = false;
      const payload = {
        sub: 1,
        exp: 122,
        type: 'access',
      };
      const accessTokenSecret = 'ACCESS_TOKEN_SECRET';

      jest.spyOn(configService, 'get').mockReturnValue(accessTokenSecret);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await authService.parseBearerToken(
        rawToken,
        isRefreshToken,
      );

      expect(result).toEqual(payload);
      expect(configService.get).toHaveBeenCalledWith(accessTokenSecret);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: expect.any(String),
      });
    });

    it('bearer 리플래쉬토큰을 받아 파싱해 리턴합니다.', async () => {
      const rawToken = 'bearer token';
      const isRefreshToken = true;
      const payload = {
        sub: 1,
        exp: 122,
        type: 'refresh',
      };
      const refreshTokenSecret = 'REFRESH_TOKEN_SECRET';

      jest.spyOn(configService, 'get').mockReturnValue(refreshTokenSecret);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await authService.parseBearerToken(
        rawToken,
        isRefreshToken,
      );

      expect(result).toEqual(payload);
      expect(configService.get).toHaveBeenCalledWith(refreshTokenSecret);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: expect.any(String),
      });
    });

    it('토큰 포멧이 잘못되면 BadRequestException 예외를 던집니다.', async () => {
      const rawToken = 'bearertoken';
      const isRefreshToken = true;

      expect(
        authService.parseBearerToken(rawToken, isRefreshToken),
      ).rejects.toThrow(BadRequestException);
    });

    it('토큰 포멧이 bearer가 아니면 BadRequestException 예외를 던집니다.', async () => {
      const rawToken = 'basic token';
      const isRefreshToken = true;

      expect(
        authService.parseBearerToken(rawToken, isRefreshToken),
      ).rejects.toThrow(BadRequestException);
    });

    it('isRefreshToken 파라미터 값과 payload의 type이 다르면 UnauthorizedException 에러를 던집니다.', async () => {
      const rawToken = 'bearer token';
      const isRefreshToken = false;
      const payload = {
        sub: 1,
        exp: 122,
        type: 'refresh',
      };
      const refreshTokenSecret = 'REFRESH_TOKEN_SECRET';

      jest.spyOn(configService, 'get').mockReturnValue(refreshTokenSecret);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      expect(
        authService.parseBearerToken(rawToken, isRefreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('isRefreshToken 파라미터 값과 payload의 type이 다르면 UnauthorizedException 에러를 던집니다.', async () => {
      const rawToken = 'bearer token';
      const isRefreshToken = true;
      const payload = {
        sub: 1,
        exp: 122,
        type: 'access',
      };
      const accessTokenSecret = 'ACCESS_TOKEN_SECRET';

      jest.spyOn(configService, 'get').mockReturnValue(accessTokenSecret);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      expect(
        authService.parseBearerToken(rawToken, isRefreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('blockToken', () => {
    it('해당 토큰을 block처리 합니다.', async () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjkyMzI2OTEsImV4cCI6MTc2OTIzMjk5MX0.C04Szuc8it5bReT1XgeN1hP_YDgix-PMBL1uGdF_h8A';
      const tokenKey = `BLOCKED_TOKEN_${token}`;
      const payload = {
        sub: 1,
        role: 1,
        type: 'refresh',
        iat: 1,
        exp: Date.now() / 1000 + 60,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      const result = await authService.blockToken(token);

      expect(result).toEqual(true);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        tokenKey,
        payload,
        expect.any(Number),
      );
    });

    it('토큰 만료시간이 지났으면 굳이 캐싱하지 않습니다.', async () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjkyMzI2OTEsImV4cCI6MTc2OTIzMjk5MX0.C04Szuc8it5bReT1XgeN1hP_YDgix-PMBL1uGdF_h8A';
      const tokenKey = `BLOCKED_TOKEN_${token}`;
      const payload = {
        sub: 1,
        role: 1,
        type: 'refresh',
        iat: 1,
        exp: Date.now() / 1000 - 60,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      const result = await authService.blockToken(token);

      expect(result).toEqual(true);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).not.toHaveBeenCalledWith(
        tokenKey,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('register', () => {
    it('basic 토큰을 받아 유저를 생성합니다.', async () => {
      const rawToken = 'basic ZGcxNDE4QG5hdmVyLmNvbTpzZGxzZGZsYWZzajEyMzQ=';
      const decode = {
        email: 'dg1418@naver.com',
        password: 'sdlsdflafsj1234',
      };
      const user = {
        email: 'dg1418@naver.com',
      };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(decode);
      jest.spyOn(userService, 'create').mockResolvedValue(user as User);

      const result = await authService.register(rawToken);

      expect(result).toEqual(user);
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(userService.create).toHaveBeenCalledWith(decode);
    });
  });

  describe('authenticate', () => {
    it('email과 password를 받아 사용자를 조회합니다.', async () => {
      const email = 'dg1418@naver.com';
      const password = 'alenbvaon1231241';
      const user = {
        id: 1,
        email: 'dg1418@naver.com',
        password: 'alenbvaon1231241',
        role: 1,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((password, userPassword) => true);

      const result = await authService.authenticate(email, password);

      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('email 조회시 사용자가 없으면 BadRequestException 예외를 던집니다.', async () => {
      const email = 'dg1418@naver.com';
      const password = 'alenbvaon1231241';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      expect(authService.authenticate(email, password)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('password 검증이 실패하면 BadRequestException 예외를 던집니다.', async () => {
      const email = 'dg1418@naver.com';
      const password = 'alenbvaon1231241';
      const user = {
        id: 1,
        email: 'dg1418@naver.com',
        password: 'alenbvaon1231241',
        role: 1,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((password, userPassword) => false);

      await expect(authService.authenticate(email, password)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });
  });

  describe('issueToken', () => {
    const user = {
      id: 1,
      role: 1,
    };
    const token = 'dsla.sdboos.sdpemfgo';

    beforeEach(() => {
      jest.spyOn(configService, 'get').mockReturnValueOnce('secretKey');
      jest.spyOn(configService, 'get').mockReturnValueOnce('secretKey');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);
    });

    it('사용자 정보를 받아 refresh jwt토큰을 생성합니다.', async () => {
      const isRefreshToken = true;

      const result = await authService.issueToken(user, isRefreshToken);

      expect(result).toEqual(token);
      expect(configService.get).toHaveBeenNthCalledWith(
        1,
        'REFRESH_TOKEN_SECRET',
      );
      expect(configService.get).toHaveBeenNthCalledWith(
        2,
        'ACCESS_TOKEN_SECRET',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: isRefreshToken ? 'refresh' : 'access',
        },
        {
          secret: 'secretKey',
          expiresIn: isRefreshToken ? '24h' : 300,
        },
      );
    });

    it('사용자 정보를 받아 access jwt토큰을 생성합니다.', async () => {
      const isRefreshToken = false;

      const result = await authService.issueToken(user, isRefreshToken);

      expect(result).toEqual(token);
      expect(configService.get).toHaveBeenNthCalledWith(
        1,
        'REFRESH_TOKEN_SECRET',
      );
      expect(configService.get).toHaveBeenNthCalledWith(
        2,
        'ACCESS_TOKEN_SECRET',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: isRefreshToken ? 'refresh' : 'access',
        },
        {
          secret: 'secretKey',
          expiresIn: isRefreshToken ? '24h' : 300,
        },
      );
    });
  });

  describe('login', () => {
    it('basic 토큰을 받아 access, refresh 토큰을 리턴합니다.', async () => {
      const rawToken = 'basic ZGcxNDE4QG5hdmVyLmNvbTpzZGxzZGZsYWZzajEyMzQ=';
      const decode = {
        email: 'dg1418@naver.com',
        password: 'sdlsdflafsj1234',
      };
      const user = {
        email: 'dg1418@naver.com',
      };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(decode);
      jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce('refreshToken');
      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce('accessToken');

      const result = await authService.login(rawToken);

      expect(result).toEqual({
        refreshToken: expect.any(String),
        accessToken: expect.any(String),
      });
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(authService.authenticate).toHaveBeenCalledWith(
        decode.email,
        decode.password,
      );
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
    });
  });
});
