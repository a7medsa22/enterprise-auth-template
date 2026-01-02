import { JwtService } from "@nestjs/jwt";
import { TokenPayload } from "../interfaces/token-payload.interface";

export class TokenService {
    constructor(private readonly jwtService: JwtService) {}

    signAccessToken(payload: TokenPayload): string {
        return this.jwtService.sign(payload);
    }

}