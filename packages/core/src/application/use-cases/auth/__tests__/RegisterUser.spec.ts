import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEventBus } from '../../../../shared/events';
import { Result } from '../../../../shared/utils/Result';
import { IEmailSender, ILogger, IPasswordHasher, ITokenGenerator } from '../../../ports';
import { RegisterUserUseCase } from '../RegisterUser';

describe('RegisterUserUseCase', () => {

  let registerUser: RegisterUserUseCase;

  const userRepository = {
    exists: jest.fn(),
    save: jest.fn(),
  } as Partial<jest.Mocked<IUserRepository>> as jest.Mocked<IUserRepository>;

  const emailSender = {
    sendVerificationEmail: jest.fn(),
  } as Partial<jest.Mocked<IEmailSender>> as jest.Mocked<IEmailSender>;

  const passwordHasher = {
    validate: jest.fn(),
    hash: jest.fn(),
  } as Partial<jest.Mocked<IPasswordHasher>> as jest.Mocked<IPasswordHasher>;
  const tokenGenerator = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  } as Partial<jest.Mocked<ITokenGenerator>> as jest.Mocked<ITokenGenerator>;

  const logger = {
    error: jest.fn(),
    info: jest.fn(),
  } as Partial<jest.Mocked<ILogger>> as jest.Mocked<ILogger>;

  const eventBus = {
    publish: jest.fn(),
  } as Partial<jest.Mocked<IEventBus>> as jest.Mocked<IEventBus>;

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
