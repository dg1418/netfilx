import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role, User } from './entity/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

// 7. mock데이터를 직접만들어줬음. 테스트용 객체이고, 메서드 이름만 똑같이한후 실제 함수는 jest.fn()으로 mock 함수를 넣어줌
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

// 1. describe()는 그룹핑 하는걸 의미함. class로 한번 묶고, 메서드들로 한번씩 묶을 꺼임
// 2. UserService 클래스를 test 해봄
describe('UserService', () => {
  let userService: UserService;

  // 3. test 전 먼저 설정되어야할것들. nest기준으로 모듈 의존성이 세팅되어야해서 그걸 세팅할꺼임
  beforeEach(async () => {
    // 4. Test.createTestingModule은 테스팅에 필요한 모듈을 만들어주는 nest의 모듈세팅 방식임
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // 5. UserService를 테스트 할꺼니까 직접 프로바이더로 세팅해주고,
        UserService,
        // 6. UserRepository 의존성을 요구하니까 프로바이더 추가해줌. 하지만 우리는 진짜repo를 테스트 할 생각은 없음.
        // 오직 UserService를 테스트하기 위한 코드임. 그래서 user repo는 mock객체로 사용할꺼임.
        {
          // 8. getRepositoryToken은 typeorm에서 제공해주는 토큰키임 테스트 할때 쓰면됨, 실제 들어가는 value는 mock객체로 씀
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  // 9. 본격적으로 테스트 코드 작성. 먼저 userService가 잘 생성되었는지 확인
  // it()에는 우리가 실제 테스트할 로직을 작성함.
  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 10. class 안의 메서드들을 describe()로 묶어줌. findAll메서드 테스트 해보자.
  describe('findAll', () => {
    // 11. it()에 테스트할 동작, "모든 유저를 리턴해줌"을 작성하고 해당 로직을 작성해줌
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'test@codefactory.ai',
        },
      ];

      // 12. 진짜 데이터베이스를 실행해볼껀 아니라 미리 테스트값을 설정할꺼임. 리포지토리의 findAndCount 함수에서 promise 성공으로 user배열이 전달되어야함
      // 해당 동작을 mock객체에 새팅해줌
      mockUserRepository.findAndCount.mockResolvedValue(users);

      // 13. userService.findAll() 메서드를 실행함.
      const result = await userService.findAll();

      // 14. expect()와 jest의 메서드들을 사용해 내 동작들을 검증해봄.
      // 15. result의 값이 users의 값과 같은지 확인
      expect(result).toEqual(users);
      // 16. mockUserRepository.findAndCount 함수가 호출되었는지 확인
      expect(mockUserRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const user = {
        id: 1,
        email: 'test@codefactory.ai',
      };

      // mockUserRepository.findOne.mockResolvedValue(user);
      // findAll 메서드 테스팅할때는 위 주석같은 세팅을 했는데 아래 코드도 똑같은 동작이다. 팀컨벤션만 똑같이 맞추기만하면 됨
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('create', () => {
    it('should create a user by createUserDto', async () => {
      const dto: CreateUserDto = {
        email: 'dg1418@naver.com',
        password: '123123123',
      };

      const user = {
        id: 1,
        email: 'dg1418@naver.com',
        role: 1,
      };

      const hashPassword = 'asdfasddgawefasfawe';
      const hashRounds = 10;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);

      const result = await userService.create(dto);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: dto.email },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: dto.email },
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: dto.email,
        password: hashPassword,
      });
    });

    it('should throw a BadRequestException if email already exists', async () => {
      const dto: CreateUserDto = {
        email: 'dg1418@naver.com',
        password: '123123123',
      };

      const user = {
        id: 1,
        email: 'dg1418@naver.com',
        role: 1,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);

      expect(userService.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });
  });

  describe('update', () => {});

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const id = 999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
      });

      const result = await userService.remove(id);

      expect(result).toEqual(id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
    });

    it('should throw a NotFoundException if user to delete is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });
});
