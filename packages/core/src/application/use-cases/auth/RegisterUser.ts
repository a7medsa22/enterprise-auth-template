import { Role, User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { Email } from '../../../domain/value-objects/Email';
import { Password } from '../../../domain/value-objects/Password';
import { IEventBus, UserRegisteredEvent } from '../../../shared/events';
import { Result } from '../../../shared/utils/Result';
import {
  IEmailSender,
  ILogger,
  IPasswordHasher,
  ITokenGenerator,
  TokenPayload,
} from '../../ports';

export interface RegisterUserDto {
  email: string;
  password: string;
}

export interface RegisterUserResult {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailSender: IEmailSender,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly logger: ILogger,
    private readonly eventBus:IEventBus,
  ) {}

  async execute(dto: RegisterUserDto): Promise<Result<RegisterUserResult>> {
    //1:>create and validate email
    const emailOrError = Email.create(dto.email);
    if (emailOrError.isFailure) return Result.fail(emailOrError.error);

    const email = emailOrError.getValue();

    //2:>Check if user exists
    const existsOrError = await this.userRepository.exists(email);
    if (existsOrError.isFailure) {
      this.logger.error(
        'Failed to check user existence',
        new Error(existsOrError.error),
      );
      return Result.fail('Unable to register user');
    }
    if (existsOrError.getValue())
      return Result.fail('User with this email already exists');

    //3:> Validate password
    const passwordValidation = this.passwordHasher.validate(dto.password);
    if (passwordValidation.isFailure)
      return Result.fail(passwordValidation.error);

    //4:> Hash Password
    const hashedOrError = await this.passwordHasher.hash(dto.password);
    if (hashedOrError.isFailure) {
      this.logger.error(
        'Failed to hash password',
        new Error(hashedOrError.error),
      );
      return Result.fail('Unable to register user');
    }

    const passwordOrError = Password.create({
      value: hashedOrError.getValue(),
      hashed: true,
    });
    if(passwordOrError.isFailure)
        return Result.fail(passwordOrError.error);

    //5:>Create user Entity
    const userOrError = User.create({
        email,
        password:passwordOrError.getValue(),
        role:[Role.USER]
    });
    if(userOrError.isFailure)
        return Result.fail(userOrError.error);
    
    const user = userOrError.getValue();
    //:> Save user
    const saveOrError = await this.userRepository.save(user);
    if(saveOrError.isFailure){
        this.logger.error('Failed to save user',new Error(saveOrError.error));
        return Result.fail('Unable to register user');
    }

    // Genrate Token 
    const tokenPayload:TokenPayload = {
        userId:user.id.getValue(),
        email:user.getEmail().getValue(),
        roles:user.getRoles(),
    }

   const accessTokenOrError = await this.tokenGenerator.generateAccessToken(user.id,tokenPayload);

   if(accessTokenOrError.isFailure){
   this.logger.error('Failed to generate access token', new Error(accessTokenOrError.error));
      return Result.fail('Unable to complete registration');
   }

     const refreshTokenOrError = await this.tokenGenerator.generateRefreshToken(user.id);
    if (refreshTokenOrError.isFailure) {
      this.logger.error('Failed to generate refresh token', new Error(refreshTokenOrError.error));
      return Result.fail('Unable to complete registration');
    }
    //:>send verification email
     this.emailSender.sendVerificationEmail(email.getValue(), 'token').catch(err => {
      this.logger.error('Failed to send verification email', err);
    });

    //:> Publish event
    await this.eventBus.publish(new UserRegisteredEvent(user.id,email));

    //:>log successfully
    this.logger.info('User registered successfully',{userId:user.id.getValue()})

    return Result.ok({
      userId: user.id.getValue(),
      email: user.getEmail().getValue(),
      accessToken: accessTokenOrError.getValue(),
      refreshToken: refreshTokenOrError.getValue(),
    });
  }
}