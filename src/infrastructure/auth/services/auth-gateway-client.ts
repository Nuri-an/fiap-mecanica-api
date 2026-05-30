import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  customer: {
    id: string;
    name: string;
    cpf: string;
    email: string;
  };
}

export interface LoginRequest {
  cpf: string;
}

@Injectable()
export class AuthGatewayClient {
  private readonly httpClient: AxiosInstance;
  private readonly logger = new Logger(AuthGatewayClient.name);
  private readonly authGatewayUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authGatewayUrl = this.configService.get<string>(
      'AUTH_GATEWAY_URL',
      'https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com',
    );

    this.httpClient = axios.create({
      baseURL: this.authGatewayUrl,
      timeout: 10000,
    });

    this.logger.log(`AuthGatewayClient initialized with URL: ${this.authGatewayUrl}`);
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      this.logger.debug(`Authenticating customer with CPF: ${this.maskCpf(request.cpf)}`);

      const response = await this.httpClient.post<AuthResponse>('/auth/login', request);

      this.logger.debug(
        `Authentication successful for customer: ${response.data.customer.id}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Authentication failed: ${error.response?.data?.message || error.message}`,
      );

      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        throw new HttpException(
          data || 'Authentication failed',
          status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Authentication service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private maskCpf(cpf: string): string {
    return cpf.substring(0, 3) + '.***.***-' + cpf.substring(cpf.length - 2);
  }
}
