import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyEmailRequest {
  @ApiProperty({
    example: '3f9d511a-1d54-4a2a-b732-47528e18dbcf',
    description: 'Unique identifier of the user to verify',
  })
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Email verification token sent to the user',
  })
  @IsNotEmpty()
  @IsString()
  verificationToken!: string;
}
