import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type JwtExpirationTime = '15m' | '7d' | '1h' | string;

export interface IConfig {
  node_env: 'dev' | 'prod' | 'test';
  app: {
    name: string;
    version: string;
    url: string;
  };
  front_end?: {
    url?: string;
    verify_email_url?: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  jwt: {
    access_token: {
      secret: string;
      expiration: JwtExpirationTime;
    };
    refresh_token: {
      secret: string;
      expiration: JwtExpirationTime;
    };
    verify_email_token: {
      secret: string;
      expiration: JwtExpirationTime;
    };
    reset_password_token: {
      secret: string;
      expiration: JwtExpirationTime;
    };
  };
  rate_limiter?: {
    max_requests?: number;
    time?: number;
  };
  password_salt_rounds?: number;
  mail?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
  };
  google?: {
    oauth?: {
      clientId?: string;
      clientSecret?: string;
    };
  };
  payos: {
    client_id?: string;
    api_key?: string;
    checksum_key?: string;
    url?: string;
    return_url?: string;
    cancel_url?: string;
  };
  bunny: {
    account_api_key: string;
    domain_storage_zone: string;
    domain_origin: string;
    pull_zone_id: number;
    storage: {
      host_name: string;
      zone_name: string;
      zone_id: number;
      password: string;
    };
  };
  gemini?: {
    api_key?: string;
  };
}

@Injectable()
export class Config {
  private readonly config: IConfig;
  constructor(private configService: ConfigService) {
    this.config = {
      app: {
        name: this.configService.get('APP_NAME', 'Capstone Project'),
        version: this.configService.get('APP_VERSION', 'v1'),
        url: this.configService.get('APP_URL', 'http://localhost:8386'),
      },
      front_end: {
        url: this.configService.get('FRONT_END_URL', 'http://localhost:3000'),
        verify_email_url: this.configService.get(
          'FRONT_END_VERIFY_EMAIL_URL',
          'http://localhost:3000/verify-email',
        ),
      },
      node_env: this.configService.get('NODE_ENV', 'dev'),
      database: {
        host: this.configService.get('DB_HOST', 'localhost'),
        port: this.configService.get('DB_PORT', 5432),
        username: this.configService.get('DB_USERNAME', 'postgres'),
        password: this.configService.get('DB_PASSWORD', '12345'),
        database: this.configService.get('DB_NAME', 'mydatabase'),
      },
      jwt: {
        access_token: {
          secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET', 'cc'),
          expiration: this.configService.get(
            'JWT_ACCESS_TOKEN_EXPIRATION',
            '15m',
          ),
        },
        refresh_token: {
          secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET', 'cc'),
          expiration: this.configService.get(
            'JWT_REFRESH_TOKEN_EXPIRATION',
            '7d',
          ),
        },
        verify_email_token: {
          secret: this.configService.get('JWT_VERIFY_EMAIL_TOKEN_SECRET', 'cc'),
          expiration: this.configService.get(
            'JWT_VERIFY_EMAIL_TOKEN_EXPIRATION',
            '15m',
          ),
        },
        reset_password_token: {
          secret: this.configService.get(
            'JWT_RESET_PASSWORD_TOKEN_SECRET',
            'cc',
          ),
          expiration: this.configService.get(
            'JWT_RESET_PASSWORD_TOKEN_EXPIRATION',
            '1h',
          ),
        },
      },
      rate_limiter: {
        max_requests: Number(
          this.configService.get('RATE_LIMITER_MAX_REQUESTS', 1000),
        ),
        time: Number(this.configService.get('RATE_LIMITER_TIME', 60)),
      },
      password_salt_rounds: Number(
        this.configService.get('PASSWORD_SALT_ROUNDS', 10),
      ),
      mail: {
        host: this.configService.get('MAIL_HOST', 'smtp.gmail.com'),
        port: Number(this.configService.get('MAIL_PORT', 587)),
        user: this.configService.get('MAIL_USER', 'mail@gmail.com'),
        pass: this.configService.get('MAIL_PASSWORD', 'xxxx xxxx xxxx xxxx'),
        secure: this.configService.get('MAIL_SECURE', false) === 'true',
      },
      google: {
        oauth: {
          clientId: this.configService.get(
            'GOOGLE_OAUTH_CLIENT_ID',
            'default-client-id',
          ),
          clientSecret: this.configService.get(
            'GOOGLE_OAUTH_CLIENT_SECRET',
            'default-client-secret',
          ),
        },
      },
      payos: {
        client_id: this.configService.get('PAYOS_CLIENT_ID', ''),
        api_key: this.configService.get('PAYOS_API_KEY', ''),
        checksum_key: this.configService.get('PAYOS_CHECKSUM_KEY', ''),
        url: this.configService.get(
          'PAYOS_URL',
          'https://api-merchant.payos.vn',
        ),
        return_url: this.configService.get('PAYOS_RETURN_URL', ''),
        cancel_url: this.configService.get('PAYOS_CANCEL_URL', ''),
      },
      bunny: {
        account_api_key: this.configService.get('BUNNY_ACCOUNT_API_KEY', ''),
        domain_storage_zone: this.configService.get(
          'BUNNY_DOMAIN_STORAGE_ZONE',
          '',
        ),
        domain_origin: this.configService.get('BUNNY_DOMAIN_ORIGIN', ''),
        pull_zone_id: Number(this.configService.get('BUNNY_PULL_ZONE_ID', 0)),
        storage: {
          host_name: this.configService.get('BUNNY_STORAGE_HOST_NAME', ''),
          zone_name: this.configService.get('BUNNY_STORAGE_ZONE_NAME', ''),
          zone_id: Number(this.configService.get('BUNNY_STORAGE_ZONE_ID', 0)),
          password: this.configService.get('BUNNY_STORAGE_PASSWORD', ''),
        },
      },
      gemini: {
        api_key: this.configService.get('GEMINI_API_KEY', ''),
      },
    };
  }

  get<T extends keyof IConfig>(key: T): IConfig[T] {
    return this.config[key];
  }

  getAll(): IConfig {
    return this.config;
  }
}
