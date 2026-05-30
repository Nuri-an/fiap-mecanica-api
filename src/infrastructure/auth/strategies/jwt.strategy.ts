import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { getLogger } from '@infrastructure/observability/logger';

interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

const logger = getLogger();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      ignoreExpiration: false,
      issuer: process.env.JWT_ISSUER ?? 'fiap-mecanica-auth',
      audience: process.env.JWT_AUDIENCE ?? 'fiap-mecanica-api',
    });
  }

  validate(payload: JwtPayload): {
    customerId: string;
    customerEmail: string;
    customerName: string;
  } {
    if (!payload.sub) {
      logger.warn({ payload }, 'Invalid JWT payload - missing sub');
      throw new UnauthorizedException('Invalid token');
    }
    logger.info(
      {
        customerId: payload.sub,
        email: payload.email,
      },
      'JWT token validated',
    );
    return {
      customerId: payload.sub,
      customerEmail: payload.email,
      customerName: payload.name,
    };
  }
}
