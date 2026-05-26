import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGatewayClient } from '@infrastructure/auth/services/auth-gateway-client';
import { LoginDto, TokenResponseDto } from '@presentation/dtos/auth/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authGatewayClient: AuthGatewayClient) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate customer with CPF',
    description:
      'Authenticates a customer using their CPF and returns a JWT token for subsequent API requests',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      validCpf: {
        summary: 'Valid CPF example',
        value: { cpf: '12345678901' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful, JWT token returned',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CPF format or customer not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Customer is inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  @ApiResponse({
    status: 503,
    description: 'Authentication service unavailable',
  })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authGatewayClient.login(loginDto);
  }
}
