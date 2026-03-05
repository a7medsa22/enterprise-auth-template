import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { LoginUser } from '@auth-template/core/application';

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
