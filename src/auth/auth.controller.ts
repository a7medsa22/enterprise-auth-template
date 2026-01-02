import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  Req,
  Get,
  UnauthorizedException
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './services/auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import type { User } from './interfaces/user.interface';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshTokenPayload } from './interfaces/token-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.email, dto.password);
    return {
      id: user.id,
      email: user.email,
      message: 'User registered successfully',
    };
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user: loggedUser } = await this.authService.login(user);

    this.setRefreshTokenCookie(res, refreshToken);

    return {
      accessToken,
      user: {
        id: loggedUser.id,
        email: loggedUser.email,
        roles: loggedUser.roles,
      },
    };
  }

  @Public() // The Guard handles the check, but we mark it public to bypass global access guard if any
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { user: RefreshTokenPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    // The strategy extracts token from bearer, but we want it from cookie?
    // Wait, the JwtRefreshStrategy I read earlier uses:
    // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // So it expects Bearer token.
    // If we want to use cookies, we need to change the strategy OR extract it here.
    // But since I shouldn't break structure too much, I will stick to what the strategy expects if the user provided it.
    // However, for "Secure Level", cookies are required.
    // I will Assume the user wants me to fix the Strategy to read from cookie OR I manually extract it.

    // Changing Strategy to read from cookie is better.
    // But for now, let's assume the client sends it in Header (as per current Strategy)
    // OR I can override it.

    // The user asked for "Secure Level".
    // I should probably update the Strategy to look in Cookies too.
    // But let's check `JwtRefreshStrategy` again.

    // If I change Strategy, I might break their client.
    // But they asked for "Secure Level".

    // For now, I will implement the controller to SET the cookie.
    // And I will try to support BOTH if possible, or just leave the strategy as is and let the client grab the cookie and put it in header (which defeats the purpose of httpOnly).

    // CORRECT APPROACH: Update Strategy to extract from Cookie.

    // But let's finish Controller first.
    // If the strategy uses Bearer, `req.user` will be the payload.
    // But if we want to use the cookie, we need to manually verify it or update strategy.

    // Let's stick to the current Strategy (Bearer) for the INPUT of refresh,
    // but OUTPUT the refresh token in Cookie.
    // This allows the client to store it in cookie.
    // BUT if it's HttpOnly, the client JS CANNOT read it to put it in the header.
    // So `JwtRefreshStrategy` MUST be updated to read from cookie if we want HttpOnly cookies to work.

    // I will update `JwtRefreshStrategy` to try extracting from cookie as well.

    const user = req.user; // Payload from strategy
    // We need the refresh token string. 
    // If it came from header, we can get it.
    // But if we want to use the cookie value...
    
    // Actually, `req.user` is the payload.
    // We need the actual refresh token string to rotate it (revoke old one).
    // `req.user` should have `tokenId`.
    
    // The `rotateRefreshToken` method in `TokenService` expects the `refreshToken` STRING.
    // We need to get that string.
    
    const refreshToken = req.cookies?.refresh_token || req.headers.authorization?.split(' ')[1];
    
    if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refresh(refreshToken);

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
        accessToken: result.accessToken,
        user: result.user
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request, 
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refresh_token || req.headers.authorization?.split(' ')[1];
    if (refreshToken) {
        await this.authService.logout(refreshToken);
    }
    
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt-access')) // Ensure we use the right guard name
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}
