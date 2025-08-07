import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  async sendEmailVerification(email: string, token: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    
    // In a real implementation, you'd use a service like SendGrid, AWS SES, or Nodemailer
    console.log(`Email verification sent to ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);
    
    // For development, we'll just log the email
    return {
      success: true,
      message: 'Verification email sent (check console for URL)',
      verificationUrl
    };
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    console.log(`Password reset email sent to ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    
    return {
      success: true,
      message: 'Password reset email sent (check console for URL)',
      resetUrl
    };
  }

  async send2faSetup(email: string, secret: string, qrCodeUrl: string) {
    console.log(`2FA setup email sent to ${email}`);
    console.log(`Secret: ${secret}`);
    console.log(`QR Code URL: ${qrCodeUrl}`);
    
    return {
      success: true,
      message: '2FA setup email sent (check console for details)',
      secret,
      qrCodeUrl
    };
  }
} 