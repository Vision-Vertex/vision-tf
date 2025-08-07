import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    // Mock environment variable
    process.env.JWT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('validate', () => {
    it('should return user payload from JWT token', () => {
      // Arrange
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'CLIENT',
        iat: 1234567890,
        exp: 1234567890,
      };

      // Act
      const result = strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'CLIENT',
      });
    });

    it('should handle payload with missing optional fields', () => {
      // Arrange
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        // role is missing
      };

      // Act
      const result = strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: undefined,
      });
    });

    it('should handle payload with only required fields', () => {
      // Arrange
      const payload = {
        sub: 'user-123',
        // email and role are missing
      };

      // Act
      const result = strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 'user-123',
        email: undefined,
        role: undefined,
      });
    });

    it('should handle empty payload', () => {
      // Arrange
      const payload = {};

      // Act
      const result = strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: undefined,
        email: undefined,
        role: undefined,
      });
    });

    it('should handle null payload', () => {
      // Arrange
      const payload = null as any;

      // Act
      const result = strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: undefined,
        email: undefined,
        role: undefined,
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with JWT secret from environment', () => {
      // Arrange
      process.env.JWT_SECRET = 'test-secret';

      // Act
      const jwtStrategy = new JwtStrategy();

      // Assert
      expect(jwtStrategy).toBeDefined();
    });

    it('should handle missing JWT_SECRET environment variable', () => {
      // Arrange
      delete process.env.JWT_SECRET;

      // Act & Assert
      expect(() => new JwtStrategy()).toThrow();
    });
  });
}); 