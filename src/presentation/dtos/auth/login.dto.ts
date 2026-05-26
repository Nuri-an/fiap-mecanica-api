import { IsString, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Customer CPF (11 digits, no formatting)',
    example: '12345678901',
  })
  @IsString()
  @IsDefined()
  cpf: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 600,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Authenticated customer information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      cpf: '12345678901',
      email: 'john@example.com',
    },
  })
  customer: {
    id: string;
    name: string;
    cpf: string;
    email: string;
  };
}
