import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { RefreshTokenPayload } from "../interfaces/token-payload.interface";
import { Request } from "express";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        private readonly config: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return request?.cookies?.refresh_token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            secretOrKey: config.get('JWT_REFRESH_SECRET')!,
            ignoreExpiration: false,
        });
    }


     validate(payload: RefreshTokenPayload) {
        return payload;
    };
};