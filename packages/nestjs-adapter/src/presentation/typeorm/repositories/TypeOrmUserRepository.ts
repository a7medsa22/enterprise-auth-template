import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@auth-template/core/domain';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/UserEntity';
import { User } from '@auth-template/core/domain';
import { Email } from '@auth-template/core/domain';
import { Result } from '@auth-template/core';
import { UserId } from '@auth-template/core/domain';
import { UserMapper } from '../mappers/UserMapper';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: UserId): Promise<Result<User>> {
    try {
      const entity = await this.repository.findOne({
        where: { id: id.getValue() },
      });
      if (!entity) return Result.fail('User not found');

      const user = UserMapper.toDomain(entity);
      return Result.ok(user);
    } catch (error) {
      return Result.fail(`Failed to find user:${error}`);
    }
  }

  async findByEmail(email: Email): Promise<Result<User>> {
    try {
      const entity = await this.repository.findOne({
        where: { email: email.getValue() },
      });
      if (!entity) return Result.fail('User not found');

      const user = UserMapper.toDomain(entity);
      return Result.ok(user);
    } catch (error) {
      return Result.fail(`Failed to find user:${error}`);
    }
  }

  async save(user: User): Promise<Result<void>> {
    try {
      const entity = UserMapper.toPersistence(user);
      await this.repository.save(entity);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save user: ${error}`);
    }
  }

  async update(user: User): Promise<Result<User>> {
    try {
      const entity = UserMapper.toPersistence(user);
      await this.repository.save(entity);
      return Result.ok(user);
    } catch (error) {
      return Result.fail(`Failed to update user: ${error}`);
    }
  }

  async delete(id: UserId): Promise<Result<void>> {
    try {
      await this.repository.delete({ id: id.getValue() });
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete user: ${error}`);
    }
  }

  async exists(email: Email): Promise<Result<boolean>> {
    try {
      const count = await this.repository.count({
        where: { email: email.getValue() },
      });
      return Result.ok(count > 0);
    } catch (error) {
      return Result.fail(`Failed to check user existence: ${error}`);
    }
  }

  async findAll(skip: number = 0, take: number = 10): Promise<Result<User[]>> {
    try {
      const entities = await this.repository.find({
        skip,
        take,
        order: { createdAt: 'DESC' },
      });
      const users = entities.map((u) => UserMapper.toDomain(u));
      return Result.ok(users);
    } catch (error) {
      return Result.fail(`Failed to find users: ${error}`);
    }
  }

  async count(): Promise<Result<number>> {
    try {
      const count = await this.repository.count();
      return Result.ok(count);
    } catch (error) {
      return Result.fail(`Failed to count users: ${error}`);
    }
  }
}
