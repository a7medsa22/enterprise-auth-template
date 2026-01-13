import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomBytes } from "crypto";
import { ConfigService } from "@nestjs/config";
import { User } from "../interfaces/user.interface";
import { UsersService } from "src/users/users.service";

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(VerificationToken)
    private readonly tokenRepository: Repository<VerificationToken>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly usersService:UsersService
  ) {}

  async sendVerificationEmail(user: User): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.tokenRepository.save({
      userId: user.id,
      token,
      type: 'email_verification',
      expiresAt,
    });

    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Verify your email',
      template: 'email-verification',
      context: { verificationUrl },
    });
  }

  async verifyEmail(token: string): Promise<User> {
    const verificationToken = await this.tokenRepository.findOne({
      where: { token, type: 'email_verification', used: false },
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Mark token as used
    await this.tokenRepository.update(verificationToken.id, { used: true });

    // Get and update user - THIS is the proper way
    const user = await this.usersService.findById(verificationToken.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update through UsersService (proper separation)
    return this.usersService.markEmailAsVerified(user.id);
  }
}