import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [
    {
      provide: 'RESEND_CLIENT',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
          throw new Error('RESEND_API_KEY is not defined');
        }
        return new Resend(apiKey);
      },
      inject: [ConfigService],
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class MailModule {}
