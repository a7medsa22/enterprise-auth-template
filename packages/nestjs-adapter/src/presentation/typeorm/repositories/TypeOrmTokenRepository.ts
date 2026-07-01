import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseTypeOrmTokenRepository, RefreshTokenEntity } from '@auth-template/typeorm';

@Injectable()
export class TypeOrmTokenRepository extends BaseTypeOrmTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    repository: Repository<RefreshTokenEntity>,
  ) {
    super(repository);
  }
}
