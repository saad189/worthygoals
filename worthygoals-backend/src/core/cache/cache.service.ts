import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: CacheStore) {}

  async saveToCache(key: string, value: any, ttl?: number) {
    if (ttl) {
      await this.cacheManager.set(key, value, { ttl });
    } else {
      await this.cacheManager.set(key, value);
    }
  }

  async getFromCache(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  async clearCache(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
