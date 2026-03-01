import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterRequest {
    @IsEmail({}, { message: 'Invalid email format' })
    email!: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password must not exceed 128 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
        message: 'Password must contain uppercase, lowercase, number and special character',
    })
    password!: string;
}