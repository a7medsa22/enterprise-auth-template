import { Injectable } from '@nestjs/common';
import { BaseMemoryCache } from '@auth-template/typeorm';

@Injectable()
export class MemoryCache extends BaseMemoryCache {}
