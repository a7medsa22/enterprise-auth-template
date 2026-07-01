import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseTypeOrmUserRepository, UserEntity } from '@auth-template/typeorm';

@Injectable()
export class TypeOrmUserRepository extends BaseTypeOrmUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    repository: Repository<UserEntity>,
  ) {
    super(repository);
  }
}
