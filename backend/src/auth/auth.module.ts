import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';
import { SecurityModule } from '../security/security.module';
import { TwoFactorService } from './two-factor.service';
import { SessionService } from './session.service';
import { RolesGuard } from './guards/roles.guard';
import { AuthGuardWithRoles } from './guards/auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuditModule,
    SecurityModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    TwoFactorService,
    SessionService,
    RolesGuard,
    AuthGuardWithRoles,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, SessionService],
})
export class AuthModule {}
