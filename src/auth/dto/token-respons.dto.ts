import { IsNotEmpty, IsString } from "class-validator";

export class TokenResponseDto {
    @IsString()
    @IsNotEmpty()
    accessToken:string;

    @IsNotEmpty()
    @IsString()
    refreshToken:string;
}