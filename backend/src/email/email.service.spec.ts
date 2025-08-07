import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmailVerification', () => {
    it('should send email verification successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'verification-token-123';
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendEmailVerification(email, token);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(consoleSpy).toHaveBeenCalledWith(`Email verification sent to ${email}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Verification URL: ${frontendUrl}/verify-email?token=${token}`);
      expect(result).toEqual({
        success: true,
        message: 'Verification email sent (check console for URL)',
        verificationUrl: `${frontendUrl}/verify-email?token=${token}`,
      });

      consoleSpy.mockRestore();
    });

    it('should handle different frontend URLs', async () => {
      // Arrange
      const email = 'user@domain.com';
      const token = 'verification-token-456';
      const frontendUrl = 'https://app.example.com';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendEmailVerification(email, token);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(result.verificationUrl).toBe(`${frontendUrl}/verify-email?token=${token}`);

      consoleSpy.mockRestore();
    });

    it('should handle special characters in token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'verification-token-with-special-chars!@#$%^&*()';
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendEmailVerification(email, token);

      // Assert
      expect(result.verificationUrl).toBe(`${frontendUrl}/verify-email?token=${token}`);

      consoleSpy.mockRestore();
    });

    it('should handle undefined frontend URL', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'verification-token-123';
      
      configService.get.mockReturnValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendEmailVerification(email, token);

      // Assert
      expect(result.verificationUrl).toBe(`undefined/verify-email?token=${token}`);

      consoleSpy.mockRestore();
    });

    it('should handle empty token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = '';
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendEmailVerification(email, token);

      // Assert
      expect(result.verificationUrl).toBe(`${frontendUrl}/verify-email?token=`);

      consoleSpy.mockRestore();
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'reset-token-123';
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendPasswordReset(email, token);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(consoleSpy).toHaveBeenCalledWith(`Password reset email sent to ${email}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Reset URL: ${frontendUrl}/reset-password?token=${token}`);
      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent (check console for URL)',
        resetUrl: `${frontendUrl}/reset-password?token=${token}`,
      });

      consoleSpy.mockRestore();
    });

    it('should handle different frontend URLs for password reset', async () => {
      // Arrange
      const email = 'user@domain.com';
      const token = 'reset-token-456';
      const frontendUrl = 'https://app.example.com';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendPasswordReset(email, token);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(result.resetUrl).toBe(`${frontendUrl}/reset-password?token=${token}`);

      consoleSpy.mockRestore();
    });

    it('should handle special characters in reset token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'reset-token-with-special-chars!@#$%^&*()';
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendPasswordReset(email, token);

      // Assert
      expect(result.resetUrl).toBe(`${frontendUrl}/reset-password?token=${token}`);

      consoleSpy.mockRestore();
    });

    it('should handle undefined frontend URL for password reset', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'reset-token-123';
      
      configService.get.mockReturnValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendPasswordReset(email, token);

      // Assert
      expect(result.resetUrl).toBe(`undefined/reset-password?token=${token}`);

      consoleSpy.mockRestore();
    });

    it('should handle empty reset token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = '';
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.sendPasswordReset(email, token);

      // Assert
      expect(result.resetUrl).toBe(`${frontendUrl}/reset-password?token=`);

      consoleSpy.mockRestore();
    });
  });

  describe('send2faSetup', () => {
    it('should send 2FA setup email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCodeUrl = 'otpauth://totp/Vision-TF%20(test%40example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Vision-TF';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.send2faSetup(email, secret, qrCodeUrl);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(`2FA setup email sent to ${email}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Secret: ${secret}`);
      expect(consoleSpy).toHaveBeenCalledWith(`QR Code URL: ${qrCodeUrl}`);
      expect(result).toEqual({
        success: true,
        message: '2FA setup email sent (check console for details)',
        secret,
        qrCodeUrl,
      });

      consoleSpy.mockRestore();
    });

    it('should handle different email addresses for 2FA setup', async () => {
      // Arrange
      const email = 'user@domain.com';
      const secret = 'ABCDEFGHIJKLMNOP';
      const qrCodeUrl = 'otpauth://totp/Vision-TF%20(user%40domain.com)?secret=ABCDEFGHIJKLMNOP&issuer=Vision-TF';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.send2faSetup(email, secret, qrCodeUrl);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(`2FA setup email sent to ${email}`);
      expect(result.secret).toBe(secret);
      expect(result.qrCodeUrl).toBe(qrCodeUrl);

      consoleSpy.mockRestore();
    });

    it('should handle special characters in secret', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'SECRET-WITH-SPECIAL-CHARS!@#$%^&*()';
      const qrCodeUrl = 'otpauth://totp/Vision-TF%20(test%40example.com)?secret=SECRET-WITH-SPECIAL-CHARS!@#$%^&*()&issuer=Vision-TF';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.send2faSetup(email, secret, qrCodeUrl);

      // Assert
      expect(result.secret).toBe(secret);
      expect(result.qrCodeUrl).toBe(qrCodeUrl);

      consoleSpy.mockRestore();
    });

    it('should handle empty secret', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = '';
      const qrCodeUrl = 'otpauth://totp/Vision-TF%20(test%40example.com)?secret=&issuer=Vision-TF';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.send2faSetup(email, secret, qrCodeUrl);

      // Assert
      expect(result.secret).toBe('');
      expect(result.qrCodeUrl).toBe(qrCodeUrl);

      consoleSpy.mockRestore();
    });

    it('should handle empty QR code URL', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCodeUrl = '';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.send2faSetup(email, secret, qrCodeUrl);

      // Assert
      expect(result.secret).toBe(secret);
      expect(result.qrCodeUrl).toBe('');

      consoleSpy.mockRestore();
    });

    it('should handle very long secrets', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'A'.repeat(100); // Very long secret
      const qrCodeUrl = `otpauth://totp/Vision-TF%20(test%40example.com)?secret=${secret}&issuer=Vision-TF`;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.send2faSetup(email, secret, qrCodeUrl);

      // Assert
      expect(result.secret).toBe(secret);
      expect(result.qrCodeUrl).toBe(qrCodeUrl);

      consoleSpy.mockRestore();
    });

    it('should handle very long QR code URLs', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCodeUrl = 'A'.repeat(1000); // Very long URL

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.send2faSetup(email, secret, qrCodeUrl);

      // Assert
      expect(result.secret).toBe(secret);
      expect(result.qrCodeUrl).toBe(qrCodeUrl);

      consoleSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple email types for same user', async () => {
      // Arrange
      const email = 'test@example.com';
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const verificationResult = await service.sendEmailVerification(email, 'verification-token');
      const resetResult = await service.sendPasswordReset(email, 'reset-token');
      const twoFactorResult = await service.send2faSetup(email, 'secret', 'qr-url');

      // Assert
      expect(verificationResult.success).toBe(true);
      expect(resetResult.success).toBe(true);
      expect(twoFactorResult.success).toBe(true);

      expect(consoleSpy).toHaveBeenCalledWith(`Email verification sent to ${email}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Password reset email sent to ${email}`);
      expect(consoleSpy).toHaveBeenCalledWith(`2FA setup email sent to ${email}`);

      consoleSpy.mockRestore();
    });

    it('should handle different users with different email formats', async () => {
      // Arrange
      const frontendUrl = 'http://localhost:3000';
      
      configService.get.mockReturnValue(frontendUrl);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result1 = await service.sendEmailVerification('user1@example.com', 'token1');
      const result2 = await service.sendEmailVerification('user2+tag@domain.co.uk', 'token2');
      const result3 = await service.sendEmailVerification('user3@subdomain.example.org', 'token3');

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      expect(result1.verificationUrl).toContain('token1');
      expect(result2.verificationUrl).toContain('token2');
      expect(result3.verificationUrl).toContain('token3');

      consoleSpy.mockRestore();
    });
  });
}); 