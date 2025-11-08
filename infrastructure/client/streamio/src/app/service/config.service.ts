// src/app/services/config.service.ts
import { Injectable } from '@angular/core';

export interface AppConfig {
  API: string;
  USER_POOL_ID: string;
  USER_POOL_CLIENT_ID: string;
  STAGE: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  setConfig(config: AppConfig): void {
    this.config = config;
  }

  get API(): string {
    return this.config?.API || '';
  }

  get USER_POOL_ID(): string {
    return this.config?.USER_POOL_ID || '';
  }

  get USER_POOL_CLIENT_ID(): string {
    return this.config?.USER_POOL_CLIENT_ID || '';
  }

  get STAGE(): string {
    return this.config?.STAGE || 'dev';
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Config not loaded!');
    }
    return this.config;
  }
}
