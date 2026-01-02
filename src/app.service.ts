import { Injectable, Logger } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly breaker: CircuitBreaker = new CircuitBreaker(
    () => this.externalApi(),
    {
      timeout: 3000, // 3초 넘으면 실패 간주
      errorThresholdPercentage: 50, // 최근 요청 중 50% 이상 실패하면 open
      resetTimeout: 5000, // 10초 후 half-open 시도
    },
  );

  constructor() {
    this.breaker.on('open', () => {
      this.logger.warn('Circuit breaker OPEN - 외부 API 차단');
    });

    this.breaker.on('halfOpen', () => {
      this.logger.log('Circuit breaker HALF-OPEN - 테스트 후출 중');
    });

    this.breaker.on('close', () => {
      this.logger.log('Circuit breaker CLOSED - 정상 상태');
    });
  }

  async externalApi(): Promise<string> {
    // return new Promise((resolve) => resolve(`hello world!`));

    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('hello world!');
      }, 10000);
    });
  }

  async getHello(): Promise<any> {
    try {
      return await this.breaker.fire();
    } catch (e) {
      this.logger.error(e.message);
      return '타임아웃';
    }
  }
}
