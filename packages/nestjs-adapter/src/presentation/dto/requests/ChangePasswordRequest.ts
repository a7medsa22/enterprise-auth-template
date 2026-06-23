import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordRequest {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'SecurePass@123',
  })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({
    description:
      'New password of the user (must contain uppercase, lowercase, number, and special character)',
    minLength: 8,
    maxLength: 128,
    example: 'NewSecurePass@123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword!: string;
}
