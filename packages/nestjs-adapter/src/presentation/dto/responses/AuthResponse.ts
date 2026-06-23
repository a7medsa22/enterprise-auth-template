import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    example: '3f9d511a-1d54-4a2a-b732-47528e18dbcf',
    description: 'Unique identifier of the user',
  })
  id!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address of the user' })
  email!: string;

  @ApiProperty({ example: ['USER'], description: 'Roles associated with the user' })
  roles!: string[];

  @ApiProperty({ example: false, description: 'Whether the email address is verified' })
  emailVerified!: boolean;

  @ApiProperty({ example: true, description: 'Whether the user account is active' })
  isActive!: boolean;

  @ApiProperty({
    example: '2026-06-23T04:24:47.000Z',
    description: 'Creation timestamp of the user account',
  })
  createdAt!: Date;
}

export class AuthResponse {
  @ApiProperty({ type: UserDto, description: 'User profile details' })
  user!: UserDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken!: string;
}
