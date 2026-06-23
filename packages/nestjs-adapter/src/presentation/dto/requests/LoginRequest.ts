import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'SecurePass@123',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}
