import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from "../interfaces/token-payload.interface";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: TokenPayload): Promise<TokenPayload> {
        if (!payload.sub || !payload.email)
            throw new UnauthorizedException('Invalid token payload');

        return {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles || [],
        };
    }
}