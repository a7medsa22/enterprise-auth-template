import { IUserRepository } from 'packages/core/src/domain/repositories/IUserRepository';
import { IRateLimiter } from '../../ports/IRateLimiter';
import {
  ILogger,
  IPasswordHasher,
  ITokenGenerator,
  TokenPayload,
} from '../../ports';
import { Result } from 'packages/core/src/shared/utils/Result';
import { Email } from 'packages/core/src/domain/value-objects/Email';

export interface LoginUserDTO {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}

export interface LoginUserResult {
  userId: string;
  email: string;
  role: string[];
  accessToken: string;
  refreshToken: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly rateLimiter: IRateLimiter,
    private readonly logger: ILogger,
  ) {}
  async execute(dto: LoginUserDTO): Promise<Result<LoginUserResult>> {
    // 1:> Rate limiting
    const rateLimitKey = `login:${dto.email}`;
    const rateLimitOrError = await this.rateLimiter.check(rateLimitKey, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });
    if (rateLimitOrError.isFailure) {
      this.logger.warn('Rate limit check failed', { email: dto.email });
      return Result.fail('Too many login attempts. Please try again later.');
    }

    const rateLimitResult = rateLimitOrError.getValue();
    if (!rateLimitResult.allowed) {
      this.logger.warn('Login rate limit exceeded', { email: dto.email });
      return Result.fail('Too many login attempts. Please try again later.');
    }

    //2:> Validate email
    const emailOrError = Email.create(dto.email);
    if (emailOrError.isFailure) {
      return Result.fail('Invalid credentials');
    }
    const email = emailOrError.getValue();

    // 3. Find user
    const userOrError = await this.userRepository.findByEmail(email);
    if (userOrError.isFailure) {
      this.logger.info('Login attempt for non-existent user', {
        email: dto.email,
      });
      return Result.fail('Invalid credentials');
    }

    const user = userOrError.getValue();

    // 4. Verify password
    const isValidOrError = await this.passwordHasher.compare(
      dto.password,
      user.getPassword().getValue(),
    );
    if (isValidOrError.isFailure || !isValidOrError.getValue()) {
      this.logger.warn('Invalid password attempt', {
        userId: user.id.getValue(),
      });
      return Result.fail('Invalid credentials');
    }

    // 5. Check if account is active
    if (!user.isActive()) {
      this.logger.warn('Login attempt for inactive account', {
        userId: user.id.getValue(),
      });
      return Result.fail('Account has been deactivated');
    }

    // 7. Update last login
    user.updateLastLogin();
    await this.userRepository.update(user);

    await this.rateLimiter.reset(rateLimitKey);

    // 9. Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id.getValue(),
      email: user.getEmail().getValue(),
      roles: user.getRoles(),
    };

    const accessTokenOrError = await this.tokenGenerator.generateAccessToken(
      user.id,
      tokenPayload,
    );
    if (accessTokenOrError.isFailure) {
      this.logger.error(
        'Failed to generate access token',
        new Error(accessTokenOrError.error),
      );
      return Result.fail('Unable to complete login');
    }

    const refreshTokenOrError = await this.tokenGenerator.generateRefreshToken(
      user.id,
    );
    if (refreshTokenOrError.isFailure) {
      this.logger.error(
        'Failed to generate refresh token',
        new Error(refreshTokenOrError.error),
      );
      return Result.fail('Unable to complete login');
    }

    return Result.ok({
      userId: user.id.getValue(),
      email: user.getEmail().getValue(),
      role: user.getRoles(),
      accessToken: accessTokenOrError.getValue(),
      refreshToken: refreshTokenOrError.getValue(),
    });
  }
}
