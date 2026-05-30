import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return normalized user payload', () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        name: 'John Doe',
        iss: 'fiap-mecanica-auth',
        aud: 'fiap-mecanica-api',
        iat: 1000000,
        exp: 9999999,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        customerId: 'user-id',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
      });
    });

    it('should throw UnauthorizedException when sub is missing', () => {
      const payload = {
        sub: '',
        email: 'test@example.com',
        name: 'John Doe',
        iss: 'fiap-mecanica-auth',
        aud: 'fiap-mecanica-api',
        iat: 1000000,
        exp: 9999999,
      };

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });
  });
});
