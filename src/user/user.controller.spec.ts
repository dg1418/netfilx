import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const users = [
        {
          id: 1,
          email: 'test@codefactory.ai',
        },
        {
          id: 2,
          email: 'jc@codefactory.ai',
        },
      ];

      const usersAndCount: [User[], number] = [users as User[], 2];

      jest.spyOn(userService, 'findAll').mockResolvedValue(usersAndCount);

      const result = await userController.findAll();

      expect(result).toEqual(usersAndCount);
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user By id', async () => {
      const id = 1;
      const user = {
        id: 1,
        email: 'test@codefactory.ai',
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(user as User);

      const result = await userController.findOne(id);

      expect(result).toEqual(user);
      expect(userService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    it('should return correct value', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@codefactory.ai',
        password: 'umjunsick',
      };

      const user = {
        id: 1,
        email: 'test@codefactory.ai',
      };

      jest.spyOn(userService, 'create').mockResolvedValue(user as User);

      const result = await userController.create(createUserDto);

      expect(result).toEqual(user);
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should return the updated user', async () => {
      const id = 1;
      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactory.ai',
        password: 'umjunsick',
      };

      const user = {
        id: 1,
        email: 'test@codefactory.ai',
      };

      jest.spyOn(userService, 'update').mockResolvedValue(user as User);

      const result = await userController.update(id, updateUserDto);

      expect(result).toEqual(user);
      expect(userService.update).toHaveBeenCalledWith(id, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should delete user and return id of deleted user', async () => {
      const id = 1;

      const user = {
        id: 1,
        email: 'test@codefactory.ai',
      };

      jest.spyOn(userService, 'remove').mockResolvedValue(id);

      const result = await userController.remove(id);

      expect(result).toEqual(id);
      expect(userService.remove).toHaveBeenCalledWith(id);
    });
  });
});
