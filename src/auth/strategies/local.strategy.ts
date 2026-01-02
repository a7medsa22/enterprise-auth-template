import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-local";
import { AuthService } from "../services/auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {

  constructor(
    private readonly authService: AuthService,
    private readonly config:ConfigService
  ) {
    super({
      usernameField:'email',
      passwordField:'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}