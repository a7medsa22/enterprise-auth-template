import { UsersService } from 'src/users/users.service';
import { RegisterDto } from '../dto/register.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { UserAuthService } from './user-auth.service';
import { TokenPayload } from '../interfaces/token-payload.interface';

export class AuthService {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly passwordHasher: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    const hash = await this.passwordHasher.hash(dto.password);

    const user = await this.userAuthService.createUser({
      email: dto.email,
      password: hash,
    });
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.tokenService.signAccessToken(payload),
      user,
    };
  }
}
