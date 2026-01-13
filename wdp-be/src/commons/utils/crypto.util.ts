import * as crypto from 'crypto';

export class CryptoUtils {
  static generateHmacSignature(data: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('hex');
  }

  static generateRandomNumber(min: number, max: number): number {
    return crypto.randomInt(min, max);
  }
}
