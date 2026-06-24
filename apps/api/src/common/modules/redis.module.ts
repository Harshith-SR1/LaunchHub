import { Module } from '@nestjs/common';
import { RedisService } from '../services/redis.service.js';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
