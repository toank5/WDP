import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST', 'smtp.gmail.com'),
          port: Number(configService.get('SMTP_PORT', '587')),
          secure: Number(configService.get('SMTP_PORT', '587')) === 465,
          // Force IPv4 connection for cloud environments without IPv6 support (e.g., Railway)
          family: 4,
          auth: {
            user:
              configService.get('SMTP_USER') || configService.get('MAIL_USER'),
            pass:
              configService.get('SMTP_PASS') || configService.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"EyeWear" <${configService.get('MAIL_FROM') || configService.get('SMTP_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(undefined, {
            inlineCssEnabled: true,
          }),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class MailModule {}
