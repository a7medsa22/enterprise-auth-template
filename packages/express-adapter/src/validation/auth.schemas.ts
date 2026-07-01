import { z } from 'zod';

// Strong password regex: uppercase, lowercase, number, special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/;

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' })
    .refine((val) => passwordRegex.test(val), {
      message: 'Password must contain uppercase, lowercase, number and special character',
    }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' })
    .refine((val) => passwordRegex.test(val), {
      message: 'Password must contain uppercase, lowercase, number and special character',
    }),
});

export const verifyEmailSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID' }),
  verificationToken: z.string().min(1, { message: 'Verification token is required' }),
});

export type RegisterSchemaDto = z.infer<typeof registerSchema>;
export type LoginSchemaDto = z.infer<typeof loginSchema>;
export type RefreshTokenSchemaDto = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordSchemaDto = z.infer<typeof changePasswordSchema>;
export type VerifyEmailSchemaDto = z.infer<typeof verifyEmailSchema>;
