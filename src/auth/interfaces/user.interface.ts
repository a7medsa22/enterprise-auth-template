export interface User {
  id: string;
  email: string;
  password: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse extends Omit<User, 'password'> {}