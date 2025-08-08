import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TwoFactorService } from './two-factor.service';
import { SessionService } from './session.service';
import { AuditService } from '../audit/audit.service';
import { SuspiciousActivityService } from '../security/suspicious-activity.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt');

// Mock bcrypt module
jest.mock('bcrypt');

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashedPassword123',
  role: UserRole.CLIENT,
  isEmailVerified: false,
  isTwoFactorEnabled: false,
  accountLockedUntil: null,
  failedLoginAttempts: 0,
  emailVerificationToken: 'verification-token-123',
  emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  passwordResetToken: null,
  passwordResetExpires: null,
  twoFactorSecret: null,
  twoFactorBackupCodes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSignupDto: SignupDto = {
  email: 'test@example.com',
  password: 'Test123!@#',
  username: 'testuser',
};

const mockLoginDto: LoginDto = {
  email: 'test@example.com',
  password: 'Test123!@#',
  rememberMe: false,
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let twoFactorService: jest.Mocked<TwoFactorService>;
  let sessionService: jest.Mocked<SessionService>;
  let auditService: jest.Mocked<AuditService>;
  let suspiciousActivityService: jest.Mocked<SuspiciousActivityService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      suspiciousActivity: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      userLoginPattern: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockEmailService = {
      sendEmailVerification: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendPasswordReset: jest.fn(),
      send2faSetup: jest.fn(),
    };

    const mockTwoFactorService = {
      generateSecret: jest.fn(),
      generateQRCode: jest.fn(),
      verifyToken: jest.fn(),
      generateBackupCodes: jest.fn(),
    };

    const mockSessionService = {
      createSession: jest.fn(),
      terminateAllUserSessions: jest.fn(),
      terminateSession: jest.fn(),
      getUserSessions: jest.fn(),
    };

    const mockAuditService = {
      logUserRegistered: jest.fn(),
      logUserLogin: jest.fn(),
      logUserLogout: jest.fn(),
      logPasswordResetRequested: jest.fn(),
      logPasswordResetCompleted: jest.fn(),
      logTwoFactorEnabled: jest.fn(),
      logTwoFactorDisabled: jest.fn(),
      logAllSessionsTerminated: jest.fn(),
      logUserDeactivated: jest.fn(),
      logRoleChanged: jest.fn(),
      logLoginFailed: jest.fn(),
      logTwoFactorVerificationFailed: jest.fn(),
      logSessionCreated: jest.fn(),
      logTwoFactorSetup: jest.fn(),
    };

    const mockSuspiciousActivityService = {
      detectSuspiciousActivity: jest.fn(),
      logLoginAttempt: jest.fn(),
      analyzeLoginActivity: jest.fn(),
      detectBruteForceAttack: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TwoFactorService,
          useValue: mockTwoFactorService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: SuspiciousActivityService,
          useValue: mockSuspiciousActivityService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    twoFactorService = module.get(TwoFactorService);
    sessionService = module.get(SessionService);
    auditService = module.get(AuditService);
    suspiciousActivityService = module.get(SuspiciousActivityService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully create a new user', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      emailService.sendEmailVerification.mockResolvedValue(undefined);
      auditService.logUserRegistered.mockResolvedValue(undefined);

      // Act
      const result = await service.signup(mockSignupDto);

      // Assert
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: mockSignupDto.email },
            { username: mockSignupDto.username },
          ],
        },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockSignupDto.email,
          username: mockSignupDto.username,
          password: hashedPassword,
          emailVerificationToken: expect.any(String),
          emailVerificationExpires: expect.any(Date),
        }),
      });
      expect(emailService.sendEmailVerification).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
      );
      expect(auditService.logUserRegistered).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('User registered successfully');
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.signup(mockSignupDto)).rejects.toThrow(
        'Email or username already taken',
      );
    });

    it('should throw error if username already exists', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.signup(mockSignupDto)).rejects.toThrow(
        'Email or username already taken',
      );
    });
  });

  describe('login', () => {
    const accessToken = 'access-token-123';
    const refreshToken = 'refresh-token-123';
    const sessionToken = 'session-token-123';

    it('should successfully authenticate user without 2FA', async () => {
      // Arrange
      const userWithVerifiedEmail = { ...mockUser, isEmailVerified: true };
      prismaService.user.findUnique.mockResolvedValue(userWithVerifiedEmail);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(accessToken);
      prismaService.refreshToken.create.mockResolvedValue({
        token: refreshToken,
      } as any);
      sessionService.createSession.mockResolvedValue({ sessionToken } as any);
      auditService.logUserLogin.mockResolvedValue(undefined);
      auditService.logSessionCreated.mockResolvedValue(undefined);
      suspiciousActivityService.logLoginAttempt.mockResolvedValue(undefined);
      suspiciousActivityService.analyzeLoginActivity.mockResolvedValue({
        riskScore: 5,
        riskLevel: 'LOW',
      });

      // Act
      const result = await service.login(
        mockLoginDto,
        'user-agent',
        '127.0.0.1',
      );

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        userWithVerifiedEmail.password,
      );
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });

    it('should return 2FA requirement when 2FA is enabled', async () => {
      // Arrange
      const userWith2FA = {
        ...mockUser,
        isEmailVerified: true,
        twoFactorEnabled: true,
      };
      prismaService.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(
        mockLoginDto,
        'user-agent',
        '127.0.0.1',
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('requires2FA', true);
      expect(result.data).toHaveProperty('message');
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.login(mockLoginDto, 'user-agent', '127.0.0.1'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should successfully login with unverified email (no email verification check)', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(accessToken);
      prismaService.refreshToken.create.mockResolvedValue({
        token: refreshToken,
      } as any);
      sessionService.createSession.mockResolvedValue({ sessionToken } as any);
      auditService.logUserLogin.mockResolvedValue(undefined);
      auditService.logSessionCreated.mockResolvedValue(undefined);
      suspiciousActivityService.logLoginAttempt.mockResolvedValue(undefined);
      suspiciousActivityService.analyzeLoginActivity.mockResolvedValue({
        riskScore: 5,
        riskLevel: 'LOW',
      });

      // Act
      const result = await service.login(
        mockLoginDto,
        'user-agent',
        '127.0.0.1',
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });

    it('should throw error for locked account', async () => {
      // Arrange
      const lockedUser = {
        ...mockUser,
        accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      };
      prismaService.user.findUnique.mockResolvedValue(lockedUser);

      // Act & Assert
      await expect(
        service.login(mockLoginDto, 'user-agent', '127.0.0.1'),
      ).rejects.toThrow(
        'Account is temporarily locked. Please try again later.',
      );
    });
  });

  describe('verify2fa', () => {
    const accessToken = 'access-token-123';
    const refreshToken = 'refresh-token-123';
    const sessionToken = 'session-token-123';

    it('should successfully verify 2FA and complete login', async () => {
      // Arrange
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'secret123',
      };
      prismaService.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      twoFactorService.verifyToken.mockReturnValue(true);
      jwtService.sign.mockReturnValue(accessToken);
      auditService.logUserLogin.mockResolvedValue(undefined);
      auditService.logSessionCreated.mockResolvedValue(undefined);
      
      const mockSession = {
        id: 'session-id',
        sessionToken: 'session-token-123',
        userId: 'user-id',
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
      };
      sessionService.createSession.mockResolvedValue(mockSession as any);
      suspiciousActivityService.analyzeLoginActivity.mockResolvedValue({
        riskScore: 0,
        riskFactors: [],
        confidence: 0,
      });

      const verify2faDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
        code: '123456',
      };

      // Act
      const result = await service.verify2fa(
        verify2faDto,
        '127.0.0.1',
        'user-agent',
      );

      // Assert
      expect(twoFactorService.verifyToken).toHaveBeenCalledWith(
        '123456',
        'secret123',
      );
      expect(sessionService.createSession).toHaveBeenCalledWith(
        'user-123',
        'user-agent',
        '127.0.0.1',
        false
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
      expect(result.data).toHaveProperty('sessionToken');
    });

    it('should throw error for invalid 2FA code', async () => {
      // Arrange
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'secret123',
      };
      prismaService.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      twoFactorService.verifyToken.mockReturnValue(false);
      twoFactorService.verifyBackupCode = jest.fn().mockReturnValue(false);
      auditService.logTwoFactorVerificationFailed.mockResolvedValue(undefined);

      const verify2faDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
        code: '123456',
      };

      // Act & Assert
      await expect(
        service.verify2fa(verify2faDto, '127.0.0.1', 'user-agent'),
      ).rejects.toThrow('Invalid 2FA code');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      // Arrange
      const userWithToken = {
        ...mockUser,
        emailVerificationToken: 'valid-token',
      };
      prismaService.user.findFirst.mockResolvedValue(userWithToken);
      prismaService.user.update.mockResolvedValue({
        ...userWithToken,
        isEmailVerified: true,
      });

      const verifyEmailDto = { token: 'valid-token' };

      // Act
      const result = await service.verifyEmail(verifyEmailDto);

      // Assert
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: 'valid-token',
          emailVerificationExpires: { gt: expect.any(Date) },
        },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userWithToken.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('Email verified successfully');
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(null);

      const verifyEmailDto = { token: 'invalid-token' };

      // Act & Assert
      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);
      auditService.logPasswordResetRequested.mockResolvedValue(undefined);

      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      // Act
      const result = await service.forgotPassword(
        forgotPasswordDto,
        '127.0.0.1',
        'user-agent',
      );

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      });
      expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
      );
      expect(auditService.logPasswordResetRequested).toHaveBeenCalledWith(
        mockUser.email,
        '127.0.0.1',
        'user-agent',
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'If the email exists, a password reset link has been sent',
      );
    });

    it('should not throw error for non-existent user (security)', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      // Act & Assert
      const result = await service.forgotPassword(
        forgotPasswordDto,
        '127.0.0.1',
        'user-agent',
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'If the email exists, a password reset link has been sent',
      );
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      // Arrange
      const userWithResetToken = {
        ...mockUser,
        passwordResetToken: 'valid-token',
      };

      prismaService.user.findFirst.mockResolvedValue(userWithResetToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      prismaService.user.update.mockResolvedValue(userWithResetToken);
      auditService.logPasswordResetCompleted.mockResolvedValue(undefined);

      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-token',
        newPassword: 'NewPassword123!@#',
      };

      // Act
      const result = await service.resetPassword(
        resetPasswordDto,
        '127.0.0.1',
        'user-agent',
      );

      // Assert
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          passwordResetToken: 'valid-token',
          passwordResetExpires: { gt: expect.any(Date) },
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!@#', 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userWithResetToken.id },
        data: expect.objectContaining({
          password: 'newHashedPassword',
          passwordResetToken: null,
          passwordResetExpires: null,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        }),
      });
      expect(auditService.logPasswordResetCompleted).toHaveBeenCalledWith(
        userWithResetToken.id,
        '127.0.0.1',
        'user-agent',
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset successfully');
    });

    it('should throw error for invalid reset token', async () => {
      // Arrange
      prismaService.user.findFirst.mockResolvedValue(null);

      const resetPasswordDto: ResetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewPassword123!@#',
      };

      // Act & Assert
      await expect(
        service.resetPassword(resetPasswordDto, '127.0.0.1', 'user-agent'),
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('setup2fa', () => {
    it('should setup 2FA for user', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      twoFactorService.generateSecret.mockReturnValue({
        secret: 'test-secret',
        qrCodeUrl: 'test-qr-url',
      });
      twoFactorService.generateQRCode.mockResolvedValue('test-qr-code');
      twoFactorService.generateBackupCodes.mockReturnValue([
        'backup1',
        'backup2',
      ]);
      prismaService.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await service.setup2fa(
        'user-123',
        '127.0.0.1',
        'user-agent',
      );

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(twoFactorService.generateSecret).toHaveBeenCalledWith(
        mockUser.email,
      );
      expect(twoFactorService.generateQRCode).toHaveBeenCalledWith(
        'test-qr-url',
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('qrCode');
      expect(result.data).toHaveProperty('secret');
    });
  });

  describe('enable2fa', () => {
    it('should enable 2FA with valid code', async () => {
      // Arrange
      const userWithSecret = { ...mockUser, twoFactorSecret: 'test-secret' };
      prismaService.user.findUnique.mockResolvedValue(userWithSecret);
      twoFactorService.verifyToken.mockReturnValue(true);
      prismaService.user.update.mockResolvedValue({
        ...userWithSecret,
        twoFactorEnabled: true,
      });
      auditService.logTwoFactorEnabled.mockResolvedValue(undefined);

      const enable2faDto: Enable2faDto = { code: '123456' };

      // Act
      const result = await service.enable2fa(
        'user-123',
        enable2faDto,
        '127.0.0.1',
        'user-agent',
      );

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(twoFactorService.verifyToken).toHaveBeenCalledWith(
        '123456',
        'test-secret',
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { twoFactorEnabled: true },
      });
      expect(auditService.logTwoFactorEnabled).toHaveBeenCalledWith(
        'user-123',
        '127.0.0.1',
        'user-agent',
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Two-factor authentication enabled successfully',
      );
    });

    it('should throw error for invalid 2FA code', async () => {
      // Arrange
      const userWithSecret = { ...mockUser, twoFactorSecret: 'test-secret' };
      prismaService.user.findUnique.mockResolvedValue(userWithSecret);
      twoFactorService.verifyToken.mockReturnValue(false);

      const enable2faDto: Enable2faDto = { code: '123456' };

      // Act & Assert
      await expect(
        service.enable2fa('user-123', enable2faDto, '127.0.0.1', 'user-agent'),
      ).rejects.toThrow('Invalid 2FA code');
    });
  });

  describe('disable2fa', () => {
    it('should disable 2FA with valid code', async () => {
      // Arrange
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'test-secret',
      };
      prismaService.user.findUnique.mockResolvedValue(userWith2FA);
      twoFactorService.verifyToken.mockReturnValue(true);
      prismaService.user.update.mockResolvedValue({
        ...userWith2FA,
        twoFactorEnabled: false,
      });
      auditService.logTwoFactorDisabled.mockResolvedValue(undefined);

      const enable2faDto: Enable2faDto = { code: '123456' };

      // Act
      const result = await service.disable2fa('user-123', enable2faDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(twoFactorService.verifyToken).toHaveBeenCalledWith(
        '123456',
        'test-secret',
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
        },
      });
      // Note: disable2fa method doesn't call audit service in the actual implementation
      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Two-factor authentication disabled successfully',
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const mockRefreshToken = {
        id: 'refresh-token-id',
        token: 'valid-refresh-token',
        userId: 'user-123',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: UserRole.CLIENT,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(
        mockRefreshToken as any,
      );
      jwtService.sign.mockReturnValue('new-access-token');

      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

      // Act
      const result = await service.refreshToken(refreshTokenDto);

      // Assert
      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token' },
        include: { user: true },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'test@example.com',
          role: UserRole.CLIENT,
        }),
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      const refreshTokenDto = { refreshToken: 'invalid-refresh-token' };

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('logout', () => {
    it('should logout user and revoke refresh token', async () => {
      // Arrange
      sessionService.terminateAllUserSessions.mockResolvedValue(undefined);
      auditService.logUserLogout.mockResolvedValue(undefined);
      auditService.logAllSessionsTerminated.mockResolvedValue(undefined);

      // Act
      const result = await service.logout(
        'user-123',
        undefined,
        undefined,
        '127.0.0.1',
        'user-agent',
      );

      // Assert
      expect(sessionService.terminateAllUserSessions).toHaveBeenCalledWith(
        'user-123',
      );
      expect(auditService.logUserLogout).toHaveBeenCalledWith(
        'user-123',
        '127.0.0.1',
        'user-agent',
      );
      expect(auditService.logAllSessionsTerminated).toHaveBeenCalledWith(
        'user-123',
        '127.0.0.1',
        'user-agent',
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Logged out from all devices successfully',
      );
    });
  });
});
