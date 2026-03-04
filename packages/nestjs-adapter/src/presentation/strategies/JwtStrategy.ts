import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
    userId: string;
    sub: string;
    email: string;
    roles: string[];
}

export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload || !payload.email) {
            throw new Error('Invalid token payload');
        }
        return {
            userId: payload.userId,
            email: payload.email,
            roles: payload.roles || [],
            sub: payload.sub
        };
    };



}