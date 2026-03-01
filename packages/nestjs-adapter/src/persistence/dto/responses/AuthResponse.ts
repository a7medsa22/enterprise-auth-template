export interface UserDto {
  id: string;
  email: string;
  roles: string[];
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}