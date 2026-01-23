import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { UserEntity } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/auth/interfaces/user.interface";

Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {}


 async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
      if(!user) throw new NotFoundException('User not found');
      return user
  }
    async markEmailAsVerified(userId: string): Promise<User> {
    await this.userRepository.update(userId, { emailVerified: true });
    return this.findById(userId);
  }

  async setActive(userId: string, isActive: boolean): Promise<User> {
    await this.userRepository.update(userId, { isActive });
    return this.findById(userId);
  }

  async updateRoles(userId: string, roles: string[]): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, { roles });
    return this.findById(userId);
  }


  async deactivateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isActive: false });
  }

  async activateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isActive: true });
  }

}