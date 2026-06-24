import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  onModuleInit() {
    const host = process.env.REDIS_HOST ?? '127.0.0.1';
    const port = process.env.REDIS_PORT ?? '6379';
    const password = process.env.REDIS_PASSWORD ?? process.env.REDIS_PASS ?? null;
    const url = process.env.REDIS_URL ?? (password ? `redis://:${encodeURIComponent(password)}@${host}:${port}` : `redis://${host}:${port}`);
    this.client = new Redis(url);
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (!this.client) throw new Error('Redis client not initialized');
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', Math.floor(ttlSeconds));
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    if (!this.client) return null;
    return await this.client.get(key);
  }

  async del(key: string) {
    if (!this.client) return 0;
    return await this.client.del(key);
  }

  async exists(key: string) {
    if (!this.client) return 0;
    return await this.client.exists(key);
  }
}
