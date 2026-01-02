import { User, UserResponse } from "./user.interface";

interface IUserService {
  findById(id: string): Promise<UserResponse | null>;
  findByEmail(email: string): Promise<UserResponse | null>;
  createUser(email: string, password: string, roles?: string[]): Promise<UserResponse>;
  updateUser(id: string, updateData: Partial<User>): Promise<UserResponse>;
  deactivateUser(id: string): Promise<void>;
}