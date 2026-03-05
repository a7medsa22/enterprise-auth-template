import { PassportStrategy } from '@nestjs/passport';
import { LoginUser } from '@auth-template/core/application';

const passportLocalModule = (() => {
  try {
    return require('passport-local');
  } catch {
    return {
      Strategy: class {
        constructor(..._args: unknown[]) {}
      },
    };
  }
})();

const Strategy = passportLocalModule.Strategy;

export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private loginUser: LoginUser) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const result = await this.loginUser.execute({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.getValue();
  }
}
