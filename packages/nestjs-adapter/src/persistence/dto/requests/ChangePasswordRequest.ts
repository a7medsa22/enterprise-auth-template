import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordRequest {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword!: string;
}