import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { UserRepositoryPort } from "../interfaces/user-repository.interface";
import { PasswordServicePort } from "../interfaces/password.interface";
import { AuthDomainService } from "./auth-domain.service";
import { UsersServiceAdapter } from "../adapters/users-service.adapter";
import { BcryptPasswordAdapter } from "../adapters/bcrypt-password.adapter";
import { JwtService } from "@nestjs/jwt";
import { User, UserResponse } from "../interfaces/user.interface";
import { TokenPayload } from "../interfaces/token-payload.interface";
import { TokenService } from "./token.service";
import { RegisterDto } from "../dto/register.dto";
import { UsersService } from "src/users/users.service";

Injectable()
export class AuthService {
    private readonly domain:AuthDomainService ;

    constructor(
        usersAdapter:UsersServiceAdapter,
        passwordAdapter:BcryptPasswordAdapter,
        private readonly jwtService:JwtService,
        private readonly tokenService:TokenService,
        private readonly usersService:UsersService
    ) {
        this.domain = new AuthDomainService(usersAdapter,passwordAdapter);
    }

    async register(dto: RegisterDto) {
    // 1. Check if user exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // 2. Validate password (Business logic - NOT in DTO)
    if (!this.passwordService.validate(dto.password)) {
      throw new BadRequestException('Password does not meet requirements');
    }

    // 3. Hash password
    const hashedPassword = await this.passwordService.hash(dto.password);

    // 4. Create user with default role
    const user = await this.usersService.createUser({
      email: dto.email,
      password: hashedPassword,
      roles: [Role.USER], // Default role - proper way
      isActive: true,
      emailVerified: false, // Must verify first!
    });

    // 5. Send verification email
    await this.emailVerificationService.sendVerificationEmail(user);

    // 6. Generate tokens (user can browse but limited access)
    const tokens = await this.tokenService.generateTokenPair(user);

    this.logger.log(`User registered: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      message: 'Registration successful. Please verify your email.',
    };
  }

  private sanitizeUser(user: User): UserResponse {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

    async validateUser(email:string,password:string) {
        return this.domain.validateUser(email,password);
    }

    async login(user:User){
        const payload:TokenPayload = {
            sub:user.id,
            email:user.email,
            roles:user.roles
        };

        return {
            acessToken: this.jwtService.sign(payload),
            user,
        };
    }
    



}