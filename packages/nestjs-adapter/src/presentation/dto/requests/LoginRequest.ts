import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequest {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}