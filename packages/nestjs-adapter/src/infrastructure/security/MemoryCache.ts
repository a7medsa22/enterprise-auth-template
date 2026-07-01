import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { BaseMemoryCache } from '@auth-template/typeorm';

@Injectable()
export class MemoryCache extends BaseMemoryCache {}
