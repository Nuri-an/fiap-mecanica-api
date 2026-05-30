# JWT Authentication Integration Guide

This document explains how the FiapMecanica API authenticates requests using JWT tokens from the Lambda authentication service.

---

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼                                             ▼
┌──────────────────────────┐    ┌─────────────────────────────┐
│  POST /auth/login        │    │  Protected Routes           │
│  Body: { cpf }           │    │  (requires JWT token)       │
│  ↓                       │    │  • GET /service-orders      │
│  Returns: JWT token      │    │  • POST /service-orders     │
│                          │    │  • GET /customers           │
└──────────────────────────┘    │  • etc.                     │
       │                        └─────────────────────────────┘
       │                                 │
       │                                 │ Authorization: Bearer {token}
       │                                 │
       └─────────────────────────────────┴──────────────┐
                                                       │
                                    ┌──────────────────┴──────────────┐
                                    │                                 │
                                    ▼                                 ▼
                    ┌─────────────────────────┐      ┌──────────────────────────┐
                    │  Lambda Auth Service    │      │  API Gateway Authorizer  │
                    │  (CPF Auth)             │      │  (JWT Validation)        │
                    │                         │      │                          │
                    │  1. Check CPF           │      │  1. Extract token        │
                    │  2. Query Database      │      │  2. Validate signature   │
                    │  3. Generate JWT        │      │  3. Check expiration     │
                    │  4. Return token        │      │  4. Allow/Deny request   │
                    └─────────────────────────┘      └──────────────────────────┘
                                    │                           │
                                    │                           │
                                    └──────────────┬────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────┐
                                    │   NestJS API             │
                                    │   (Protected Endpoint)   │
                                    │                          │
                                    │   Validates JWT claims   │
                                    │   in request context     │
                                    └──────────────────────────┘
```

---

## Authentication Flow

### Step 1: Get JWT Token (from Lambda)

```bash
curl -X POST https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cpf": "123.456.789-09"}'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 600,
  "customer": {
    "id": "uuid...",
    "name": "João Silva",
    "cpf": "123.456.789-09",
    "email": "joao@example.com"
  }
}
```

### Step 2: Use Token on Protected Endpoints

```bash
curl -X GET http://k8s-fiapmeca-...elb.amazonaws.com/api/v1/service-orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Implementation Details

### 1. JWT Strategy (NestJS)

Located at: `src/infrastructure/auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      issuer: 'fiap-mecanica-auth',
      audience: 'fiap-mecanica-api',
    });
  }

  validate(payload: JwtPayload) {
    return {
      customerId: payload.sub,
      customerEmail: payload.email,
      customerName: payload.name,
    };
  }
}
```

**Configuration:**
- Extracts token from `Authorization: Bearer <token>` header
- Validates signature using JWT_SECRET
- Verifies issuer and audience claims
- Returns decoded claims for use in controllers

### 2. JWT Auth Guard

Located at: `src/infrastructure/auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Usage in Controllers:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('service-orders')
async getOrders(@Request() req) {
  const customerId = req.user.customerId;
  // Protected endpoint - only accessible with valid JWT
}
```

### 3. Lambda Authorizer (Optional)

Located at: `src/authorizer.ts` in auth-lambda repository

**Validates at API Gateway level** (before request reaches NestJS):
- Extracts token from Authorization header
- Validates JWT signature
- Returns IAM policy (Allow/Deny)
- Injects context into request for NestJS to access

---

## Environment Variables

### API Configuration

```env
# JWT Secret (from Secrets Manager)
JWT_SECRET=your-jwt-secret-key

# JWT Claims Configuration
JWT_ISSUER=fiap-mecanica-auth
JWT_AUDIENCE=fiap-mecanica-api
JWT_EXPIRATION=24h

# Auth Gateway (Lambda Endpoint)
AUTH_GATEWAY_URL=https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com

# AWS Configuration
AWS_REGION=us-east-1
JWT_SECRET_ARN=arn:aws:secretsmanager:us-east-1:...:secret:...
```

### Kubernetes Configuration

```yaml
env:
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: fiap-mecanica-secrets
        key: jwt-secret
  - name: JWT_ISSUER
    value: "fiap-mecanica-auth"
  - name: JWT_AUDIENCE
    value: "fiap-mecanica-api"
  - name: JWT_EXPIRATION
    value: "24h"
  - name: AUTH_GATEWAY_URL
    value: "https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com"
  - name: AWS_REGION
    value: "us-east-1"
```

---

## Protected Routes

The following endpoints require JWT authentication:

### Service Orders
- `GET /api/v1/service-orders` - List all orders
- `POST /api/v1/service-orders` - Create new order
- `GET /api/v1/service-orders/{id}` - Get specific order
- `PUT /api/v1/service-orders/{id}` - Update order
- `PATCH /api/v1/service-orders/{id}/status` - Update status

### Customers
- `GET /api/v1/customers` - List all customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/{id}` - Get specific customer

### Vehicles
- `GET /api/v1/vehicles` - List all vehicles
- `POST /api/v1/vehicles` - Create vehicle
- `GET /api/v1/vehicles/{id}` - Get specific vehicle

### Mechanics
- `GET /api/v1/mechanics` - List all mechanics
- `GET /api/v1/mechanics/{id}` - Get specific mechanic

### Public Routes
- `POST /api/v1/auth/login` - Authenticate with CPF (no token required)
- `GET /api/v1/health` - Health check (no token required)

---

## JWT Token Structure

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "customer-uuid",
  "name": "João Silva",
  "email": "joao@example.com",
  "iss": "fiap-mecanica-auth",
  "aud": "fiap-mecanica-api",
  "iat": 1621234567,
  "exp": 1621321000
}
```

- **sub**: Subject (Customer ID)
- **iss**: Issuer (Lambda auth service)
- **aud**: Audience (this API)
- **iat**: Issued at timestamp
- **exp**: Expiration timestamp

### Signature
```
HMACSHA256(base64(header) + "." + base64(payload), secret)
```

---

## Error Handling

### Missing Token
```
Status: 401 Unauthorized
Body: {
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Invalid Token Format
```
Status: 401 Unauthorized
Body: {
  "statusCode": 401,
  "message": "Invalid token format"
}
```

### Expired Token
```
Status: 401 Unauthorized
Body: {
  "statusCode": 401,
  "message": "jwt expired"
}
```

### Invalid Signature
```
Status: 401 Unauthorized
Body: {
  "statusCode": 401,
  "message": "invalid signature"
}
```

### Invalid Claims
```
Status: 401 Unauthorized
Body: {
  "statusCode": 401,
  "message": "Invalid token - issuer mismatch"
}
```

---

## Testing JWT Authentication

### Using Postman

1. **Authenticate (Get Token)**
   ```
   POST https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com/auth/login
   Body: { "cpf": "123.456.789-09" }
   ```

2. **Copy token from response**
   - Extract the `access_token` value

3. **Set Postman environment variable**
   - Variable name: `ACCESS_TOKEN`
   - Value: Paste the token

4. **Use token on protected endpoints**
   - Header: `Authorization: Bearer {{ACCESS_TOKEN}}`

### Using cURL

```bash
# Step 1: Get token
TOKEN=$(curl -s -X POST https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cpf":"123.456.789-09"}' \
  | jq -r '.access_token')

# Step 2: Use token on protected endpoint
curl -X GET http://localhost:3000/api/v1/service-orders \
  -H "Authorization: Bearer $TOKEN"
```

### Using JavaScript/TypeScript

```typescript
// Get token
const loginResponse = await fetch(
  'https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: '123.456.789-09' })
  }
);
const { access_token } = await loginResponse.json();

// Use token
const apiResponse = await fetch(
  'http://localhost:3000/api/v1/service-orders',
  {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }
);
const data = await apiResponse.json();
```

---

## Troubleshooting

### Token Not Being Validated

**Check:**
1. JWT_SECRET environment variable is set correctly
2. Token is in correct format: `Authorization: Bearer <token>`
3. Token is not expired (check exp claim)
4. Issuer and audience match configuration

**Debug:**
```bash
# Decode JWT (without verification)
curl -s https://jwt.io/#decoded  # Use online decoder
# Check claims (iss, aud, exp)
```

### 401 Unauthorized on Protected Routes

**Possible causes:**
1. Missing Authorization header
2. Malformed token
3. Wrong secret key
4. Expired token
5. Issuer/audience mismatch

**Solution:**
1. Verify token exists in header
2. Use `/auth/login` to get fresh token
3. Check environment variables
4. Decode token to verify claims

### API Gateway Authorizer Issues

**Check:**
1. Authorizer Lambda is deployed
2. API Gateway has authorizer configured
3. Lambda has permission to be invoked by API Gateway
4. IAM role has Secrets Manager access

**Debug:**
```bash
# Test authorizer directly
aws lambda invoke \
  --function-name fiap-mecanica-authorizer \
  --payload '{"authorizationToken":"Bearer ","methodArn":""}' \
  response.json
```

---

## Security Best Practices

1. **Always use HTTPS** for API endpoints
2. **Rotate JWT secret** regularly
3. **Use short expiration times** (10 minutes recommended)
4. **Implement refresh tokens** for longer sessions
5. **Validate claims** (issuer, audience, expiration)
6. **Log authentication failures** for monitoring
7. **Use environment variables** for secrets (not hardcoded)
8. **Implement rate limiting** on `/auth/login`

---

## Next Steps

1. Deploy authorizer Lambda to AWS
2. Configure API Gateway with authorizer
3. Set environment variables in Kubernetes
4. Test end-to-end authentication flow
5. Set up monitoring and alerts
6. Document API security for clients

---

**Status**: ✅ Integration ready for deployment
**Last Updated**: 2026-05-27
