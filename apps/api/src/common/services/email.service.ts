import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationEmail(email: string, token: string) {
    this.logger.log(`Verification email queued for ${email} with token ${token}`);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    this.logger.log(`Password reset email queued for ${email} with token ${token}`);
  }
}