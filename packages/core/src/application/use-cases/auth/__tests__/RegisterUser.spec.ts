import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEventBus } from '../../../../shared/events';
import { Result } from '../../../../shared/utils/Result';
import { IEmailSender, ILogger, IPasswordHasher, ITokenGenerator } from '../../../ports';
import { RegisterUserUseCase } from '../RegisterUser';

describe('RegisterUserUseCase', () => {

  let registerUser: RegisterUserUseCase;

  const userRepository = jest.mocked({
    exists: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as unknown as IUserRepository)

  const emailSender = jest.mocked({
    sendVerificationEmail: jest.fn(),
    send: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  } as unknown as IEmailSender)

  const passwordHasher = jest.mocked({
    validate: jest.fn(),
    hash: jest.fn(),
  } as unknown as IPasswordHasher)
  
  const tokenGenerator = jest.mocked({
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  } as unknown as ITokenGenerator)
  
  const logger = jest.mocked({
    error: jest.fn(),
    info: jest.fn(),
  } as unknown as ILogger)

  const eventBus = jest.mocked({
    publish: jest.fn(),
  } as unknown as IEventBus)

  beforeEach(() => {
    jest.clearAllMocks();

    registerUser = new RegisterUserUseCase(
      userRepository,
      emailSender,
      passwordHasher,
      tokenGenerator,
      logger,
      eventBus,
    );
  });

  it('should register user successfully',async()=>{
    const dto = {
        email:'test@example.com',
        password:'Test@123'
    }
    userRepository.exists.mockResolvedValue(Result.ok(false));
    passwordHasher.validate.mockReturnValue(Result.ok(true));
    passwordHasher.hash.mockResolvedValue(Result.ok('hashed-password'));
    userRepository.save.mockResolvedValue(Result.ok());
    tokenGenerator.generateAccessToken.mockResolvedValue(Result.ok('acces-token'))
    tokenGenerator.generateRefreshToken.mockResolvedValue(Result.ok('refresh-token'))
    emailSender.sendVerificationEmail.mockResolvedValue(Result.ok());

    const result = await registerUser.execute(dto);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().email).toBe(dto.email)
    expect(result.getValue().accessToken).toBe('acces-token')
    expect(result.getValue().refreshToken).toBe('refresh-token')
    
    expect(userRepository.save).toHaveBeenCalled()
  });
  it('should fail if user already exists', async () => {
  userRepository.exists.mockResolvedValue(Result.ok(true));

  const result = await registerUser.execute({
    email: 'test@test.com',
    password: 'password123',
  });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBe('User with this email already exists');

  expect(userRepository.save).not.toHaveBeenCalled();
});

it('should fail if password validation fails', async () => {
  userRepository.exists.mockResolvedValue(Result.ok(false));
  passwordHasher.validate.mockReturnValue(Result.fail('Weak password'));

  const result = await registerUser.execute({
    email: 'test@test.com',
    password: '123',
  });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBe('Weak password');

  expect(passwordHasher.hash).not.toHaveBeenCalled();
});

it('should fail if access token generation fails', async () => {
  userRepository.exists.mockResolvedValue(Result.ok(false));
  passwordHasher.validate.mockReturnValue(Result.ok(true));
  passwordHasher.hash.mockResolvedValue(Result.ok('hashed-pass'));
  userRepository.save.mockResolvedValue(Result.ok());

  tokenGenerator.generateAccessToken.mockResolvedValue(Result.fail('jwt error'));

  const result = await registerUser.execute({
    email: 'test@test.com',
    password: 'password123',
  });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBe('Unable to complete registration');
});


});
