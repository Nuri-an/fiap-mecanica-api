# FiapMecanica API - Documentação Completa

## 📋 Índice
1. [Descrição](#descrição)
2. [Tecnologias](#tecnologias)
3. [Arquitetura](#arquitetura)
4. [Setup e Instalação](#setup-e-instalação)
5. [Execução](#execução)
6. [Deployment](#deployment)
7. [APIs e Documentação](#apis-e-documentação)
8. [Estrutura do Projeto](#estrutura-do-projeto)

---

## 🎯 Descrição

### Propósito Geral
O **FiapMecanica API** é um sistema de gestão de ordens de serviço para oficinas mecânicas construído com arquitetura cloud-native. Permite gerenciar:

- **Clientes e Veículos**: Cadastro e manutenção de clientes e seus veículos
- **Ordens de Serviço**: Criação, atualização e rastreamento de ordens com status (Diagnóstico, Execução, Finalização)
- **Serviços e Peças**: Catálogo de serviços oferecidos e peças disponíveis
- **Autenticação**: CPF-based authentication via Lambda serverless
- **Observabilidade**: Completa rastreabilidade com Datadog e X-Ray

### Casos de Uso Principais

1. **Recepcionista/Gerente**:
   - Criar nova ordem de serviço quando cliente chega com veículo
   - Atualizar status conforme o trabalho progride
   - Consultar histórico de ordens

2. **Mecânico**:
   - Ver ordens pendentes (status Diagnóstico/Execução)
   - Atualizar status da ordem
   - Registrar peças usadas

3. **Sistema de Integração**:
   - APIs para integração com sistemas externos
   - Webhooks para notificação de eventos
   - Exportação de dados

### Diferencial Técnico
- ✓ **Clean Architecture**: Separação clara de camadas (Domain, Application, Infrastructure, Presentation)
- ✓ **Cloud-Native**: Kubernetes-ready, serverless auth, observabilidade integrada
- ✓ **Altamente Testado**: 381 testes automatizados (100% passing)
- ✓ **CI/CD Automatizado**: GitHub Actions com testes, build e deploy automático
- ✓ **Segurança**: JWT authentication, VPC isolation, CORS configurado

---

## 🛠️ Tecnologias

### Backend
| Camada | Tecnologia | Versão | Propósito |
|--------|-----------|--------|----------|
| **Framework** | NestJS | 10.3.0 | Framework Node.js type-safe |
| **Linguagem** | TypeScript | 5.4.5 | Tipagem estática |
| **ORM** | Prisma | 5.8.0 | Database abstraction |
| **Autenticação** | Passport.js + JWT | 10.0.3 / 10.2.0 | Bearer token auth |
| **Validação** | class-validator | 0.14.0 | DTO validation |
| **Docs API** | Swagger | 7.4.2 | OpenAPI documentation |

### Banco de Dados
| Componente | Tecnologia | Versão | Propósito |
|-----------|-----------|--------|----------|
| **Database** | PostgreSQL | 15.x | Relational database |
| **Hosting** | AWS RDS | Managed | Production database |
| **Migrations** | Prisma Migrate | 5.8.0 | Schema versioning |

### Infraestrutura
| Componente | Tecnologia | Versão | Propósito |
|-----------|-----------|--------|----------|
| **Container** | Docker | 20.10.x | Container images |
| **Orquestração** | Kubernetes (EKS) | 1.30 | Container orchestration |
| **Ingress** | AWS ALB | Latest | Load balancing |
| **Observabilidade** | Datadog | SaaS | APM e monitoring |
| **Tracing** | AWS X-Ray | Integrated | Distributed tracing |
| **Logging** | CloudWatch + Datadog | Integrated | Log aggregation |

### Testing
| Ferramenta | Versão | Propósito |
|-----------|--------|----------|
| Jest | 30.2.0 | Unit testing framework |
| supertest | 6.3.3 | HTTP assertion library |
| ts-jest | 29.4.6 | Jest TypeScript support |

### DevOps
| Ferramenta | Propósito |
|-----------|----------|
| GitHub Actions | CI/CD pipeline |
| Amazon ECR | Docker image registry |
| AWS Lambda | CPF authentication service |
| AWS API Gateway | HTTP API management |

---

## 🏗️ Arquitetura

### Diagrama Geral da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│                          Cliente / Frontend                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTPS (REST API)
             │
    ┌────────▼─────────────────────────────┐
    │  AWS API Gateway / Application       │
    │  Load Balancer (ALB)                 │
    │  https://<ALB_ENDPOINT>/api/v1       │
    └────────┬─────────────────────────────┘
             │
             │ HTTP
             │
    ┌────────▼──────────────────────────────────────────┐
    │   AWS EKS - Kubernetes Cluster                    │
    │   Namespace: fiap-mecanica                        │
    │                                                    │
    │  ┌─────────────────────────────────────────────┐ │
    │  │  Pod 1: NestJS API (Replica 1)              │ │
    │  │  ┌───────────────────────────────────────┐  │ │
    │  │  │ Presentation Layer (Controllers)      │  │ │
    │  │  │ ├─ Auth Controller                    │  │ │
    │  │  │ ├─ Customer Controller                │  │ │
    │  │  │ ├─ Vehicle Controller                 │  │ │
    │  │  │ ├─ Service Controller                 │  │ │
    │  │  │ ├─ Part Controller                    │  │ │
    │  │  │ └─ Service Order Controller           │  │ │
    │  │  └───────────────────────────────────────┘  │ │
    │  │  ┌───────────────────────────────────────┐  │ │
    │  │  │ Application Layer (Use Cases)         │  │ │
    │  │  │ ├─ Create/Update/Delete Customers    │  │ │
    │  │  │ ├─ Manage Vehicles                   │  │ │
    │  │  │ ├─ Manage Service Orders             │  │ │
    │  │  │ └─ Manage Services & Parts           │  │ │
    │  │  └───────────────────────────────────────┘  │ │
    │  │  ┌───────────────────────────────────────┐  │ │
    │  │  │ Domain Layer (Entities & Business)    │  │ │
    │  │  │ ├─ Customer Value Object              │  │ │
    │  │  │ ├─ ServiceOrder Aggregate             │  │ │
    │  │  │ ├─ Money Value Object                 │  │ │
    │  │  │ └─ Custom Exceptions                  │  │ │
    │  │  └───────────────────────────────────────┘  │ │
    │  │  ┌───────────────────────────────────────┐  │ │
    │  │  │ Infrastructure Layer                  │  │ │
    │  │  │ ├─ Prisma (ORM)                      │  │ │
    │  │  │ ├─ PostgreSQL Driver                 │  │ │
    │  │  │ ├─ HTTP Client (Axios)               │  │ │
    │  │  │ └─ Auth Client (Lambda Gateway)      │  │ │
    │  │  └───────────────────────────────────────┘  │ │
    │  │  ┌───────────────────────────────────────┐  │ │
    │  │  │ Observability                         │  │ │
    │  │  │ ├─ Structured JSON Logging (Pino)    │  │ │
    │  │  │ ├─ Datadog Integration                │  │ │
    │  │  │ └─ X-Ray Tracing                      │  │ │
    │  │  └───────────────────────────────────────┘  │ │
    │  └─────────────────────────────────────────────┘ │
    │                                                    │
    │  ┌─────────────────────────────────────────────┐ │
    │  │  Pod 2 & Pod 3: (Réplicas idênticas)       │ │
    │  └─────────────────────────────────────────────┘ │
    │                                                    │
    └────────┬──────────────────────────────────────────┘
             │
             │ Via VPC
             │
    ┌────────┴──────────────────────────────┐
    │  AWS RDS PostgreSQL                   │
    │  Database: fiap_mecanica              │
    │  Users, Orders, Services, Parts       │
    └───────────────────────────────────────┘
             │
             │
    ┌────────▼──────────────────────────────┐
    │  AWS Lambda (Auth Service)            │
    │  fiap-mecanica-auth                   │
    │  CPF validation & JWT signing         │
    └──────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │  AWS Secrets Manager                  │
    │  - Database URL                       │
    │  - JWT Secret                         │
    └───────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │  Datadog (Observabilidade)            │
    │  - APM Traces                         │
    │  - Logs Aggregation                   │
    │  - Infrastructure Metrics             │
    │  - Custom Dashboards                  │
    └───────────────────────────────────────┘
```

### Fluxo de Requisição

```
1. Cliente → API Gateway (ALB) → Ingress (K8s) → Pod
   ├─ HTTPS encryption
   ├─ Health checks
   └─ Load balancing (round-robin)

2. Pod → Auth Service
   ├─ POST /auth/login (CPF)
   ├─ AWS Lambda validates CPF
   ├─ Database lookup
   └─ JWT token returned

3. Pod → PostgreSQL
   ├─ Prisma ORM queries
   ├─ Connection pooling
   └─ Prepared statements (SQL injection prevention)

4. Observable via
   ├─ Datadog APM (trace every request)
   ├─ CloudWatch logs
   ├─ AWS X-Ray (distributed tracing)
   └─ Structured JSON logs
```

### Estrutura de Camadas (Clean Architecture)

```
┌─────────────────────────────────────────────────────┐
│             PRESENTATION LAYER                      │
│  (Controllers, DTOs, HTTP responses)                │
│  ├─ @Controller decorators                          │
│  ├─ Request validation (class-validator)            │
│  └─ Swagger documentation                           │
└──────────────────┬──────────────────────────────────┘
                   │ Depends on
┌──────────────────▼──────────────────────────────────┐
│           APPLICATION LAYER                         │
│  (Use Cases, Ports, Business Logic)                 │
│  ├─ Use case classes (CreateCustomer, etc)          │
│  ├─ Ports/Interfaces (repositories)                 │
│  └─ DTOs & exceptions                               │
└──────────────────┬──────────────────────────────────┘
                   │ Depends on
┌──────────────────▼──────────────────────────────────┐
│             DOMAIN LAYER                            │
│  (Entities, Value Objects, Exceptions)              │
│  ├─ Customer entity                                 │
│  ├─ ServiceOrder aggregate                          │
│  ├─ Money, Quantity value objects                   │
│  └─ Custom business exceptions                      │
└──────────────────┬──────────────────────────────────┘
                   │ Depends on
┌──────────────────▼──────────────────────────────────┐
│        INFRASTRUCTURE LAYER                         │
│  (Repositories, External Services, DB)              │
│  ├─ Prisma repositories                             │
│  ├─ Auth gateway client                             │
│  ├─ Logger & monitoring                             │
│  └─ Database connection                             │
└──────────────────────────────────────────────────────┘
```

---

## 📦 Setup e Instalação

### Pré-Requisitos

```bash
# Versões mínimas requeridas
Node.js >= 18.0.0
npm >= 9.0.0
Docker >= 20.10.0 (para containerização)
PostgreSQL >= 12.0 (para desenvolvimento)
kubectl >= 1.27.0 (para Kubernetes)
```

### Step 1: Clonar Repositório

```bash
$ git clone https://github.com/Nuri-an/fiap-mecanica-api.git
$ cd fiap-mecanica-api
$ git checkout main
```

### Step 2: Instalar Dependências

```bash
# Instalar dependências Node.js
$ npm install

# Gerar tipos Prisma
$ npm run prisma:generate

# Verificar instalação
$ npm list | head -20
```

### Step 3: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
$ cp .env.example .env.local

# Editar com valores corretos
$ nano .env.local
```

**Conteúdo do .env.local**:
```bash
# Aplicação
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database (local development)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fiap_mecanica"

# JWT Configuration
# Deve ser o mesmo usado pela função Lambda
JWT_SECRET=seu-super-secret-jwt-key-compartilhado-com-lambda
JWT_EXPIRATION=24h

# Auth Gateway (Lambda)
AUTH_GATEWAY_URL=https://o84qcs3lx7.execute-api.us-east-1.amazonaws.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

# Logs
LOG_LEVEL=debug
```

### Step 4: Setup do Banco de Dados (Local)

```bash
# Opção 1: Using Docker
$ docker run --name fiap-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fiap_mecanica \
  -p 5432:5432 \
  -d postgres:15-alpine

# Opção 2: PostgreSQL instalado localmente
$ createdb fiap_mecanica

# Executar migrations
$ npm run prisma:migrate

# Seed data (opcional)
$ npm run prisma:seed
```

### Step 5: Verificar Instalação

```bash
# Rodar testes
$ npm test

# Esperado: All 381 tests passing ✓

# Compilar TypeScript
$ npm run build

# Verificar lint
$ npm run lint
```

---

## 🚀 Execução

### Modo Desenvolvimento (Com Hot Reload)

```bash
# Inicia a aplicação com watch mode
$ npm run start:dev

# Output esperado:
# [Nest] 12345 - 05/26/2026, 22:00:00     LOG [NestFactory]
# Starting Nest application...
# [Nest] 12345 - 05/26/2026, 22:00:05     LOG [InstanceLoader]
# AuthModule dependencies initialized
# ...
# [Nest] 12345 - 05/26/2026, 22:00:10     LOG
# Application is running on: http://localhost:3000/api/v1

# Health check
$ curl http://localhost:3000/api/v1/health
# {"status":"ok"}
```

### Modo Produção

```bash
# Build
$ npm run build

# Iniciar
$ npm run start:prod

# Ou via Docker
$ docker build -t fiap-mecanica-api:latest .
$ docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  fiap-mecanica-api:latest
```

### Debug Mode

```bash
$ npm run start:debug

# Conectar debugger em chrome://inspect
```

### Executar Testes

```bash
# Todos os testes
$ npm test

# Com coverage
$ npm run test:cov

# Watch mode
$ npm run test:watch

# E2E tests
$ npm run test:e2e
```

---

## 🐳 Deployment

### Build Docker

```bash
# Build imagem
$ docker build -t 941377151341.dkr.ecr.us-east-1.amazonaws.com/fiap-mecanica-api:latest .

# Login no ECR
$ aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 941377151341.dkr.ecr.us-east-1.amazonaws.com

# Push para ECR
$ docker push 941377151341.dkr.ecr.us-east-1.amazonaws.com/fiap-mecanica-api:latest
```

### Deploy em Kubernetes

```bash
# Aplicar manifesto
$ kubectl apply -f k8s/overlays/production/

# Verificar deployment
$ kubectl get deployment -n fiap-mecanica
$ kubectl get pods -n fiap-mecanica

# Ver logs
$ kubectl logs -n fiap-mecanica \
  -l app=fiap-mecanica-api \
  -f

# Acessar via ALB
$ kubectl get ingress -n fiap-mecanica
# Use o ADDRESS da resposta
```

### CI/CD Automático (GitHub Actions)

Pipeline automática quando push para main:

```bash
# 1. Checkout code
# 2. Setup Node.js
# 3. Install dependencies
# 4. Run linter
# 5. Run 381 tests
# 6. Build Docker image
# 7. Push to Amazon ECR
# 8. Deploy to EKS (se em main)
```

Ver `.github/workflows/ci.yml` para detalhes.

---

## 📚 APIs e Documentação

### Swagger Documentation

**URLs**:
- **Local**: http://localhost:3000/api/docs
- **Staging**: `https://staging-api.fiap-mecanica.com/api/docs`
- **Production**: `https://api.fiap-mecanica.com/api/docs`

### Postman Collection

Disponível em: `/postman/fiap-mecanica-api.postman_collection.json`

**Importar no Postman**:
1. Abrir Postman
2. File → Import
3. Selecionar o arquivo .json
4. Coleção importada com todos os endpoints

### Endpoints Principais

#### Autenticação

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "cpf": "12345678910"
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 600,
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "cpf": "12345678910",
    "email": "joao@example.com"
  }
}
```

#### Customers (Clientes)

```http
# Listar
GET /api/v1/customers
Authorization: Bearer <TOKEN>

# Criar
POST /api/v1/customers
Authorization: Bearer <TOKEN>
Content-Type: application/json
{
  "name": "João Silva",
  "cpf": "12345678910",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321"
}

# Obter por ID
GET /api/v1/customers/{id}
Authorization: Bearer <TOKEN>

# Atualizar
PUT /api/v1/customers/{id}
Authorization: Bearer <TOKEN>

# Deletar
DELETE /api/v1/customers/{id}
Authorization: Bearer <TOKEN>
```

#### Service Orders (Ordens de Serviço)

```http
# Listar
GET /api/v1/service-orders
Authorization: Bearer <TOKEN>

# Criar
POST /api/v1/service-orders
Authorization: Bearer <TOKEN>
Content-Type: application/json
{
  "vehicleId": "6f4e2a1b-c5d2-4e3b-8a9f-1c7d5e9a2b3f",
  "priority": "MEDIA",
  "description": "Revisão preventiva"
}

# Obter
GET /api/v1/service-orders/{id}
Authorization: Bearer <TOKEN>

# Atualizar status
PATCH /api/v1/service-orders/{id}
Authorization: Bearer <TOKEN>
Content-Type: application/json
{
  "status": "execucao"
}
```

#### Vehicles (Veículos)

```http
# Listar
GET /api/v1/vehicles
Authorization: Bearer <TOKEN>

# Criar
POST /api/v1/vehicles
Authorization: Bearer <TOKEN>
{
  "licensePlate": "ABC-1234",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2022
}
```

#### Services (Serviços)

```http
# Listar
GET /api/v1/services
Authorization: Bearer <TOKEN>

# Criar
POST /api/v1/services
Authorization: Bearer <TOKEN>
{
  "name": "Revisão Geral",
  "description": "Revisão completa da manutenção",
  "price": 150.00
}
```

#### Parts (Peças)

```http
# Listar
GET /api/v1/parts
Authorization: Bearer <TOKEN>

# Criar
POST /api/v1/parts
Authorization: Bearer <TOKEN>
{
  "name": "Pastilha de Freio",
  "sku": "BRAKE-PAD-001",
  "price": 50.00
}
```

### Schemas e Models

Veja Swagger docs para:
- ✓ Modelos completos de request/response
- ✓ Validações de entrada
- ✓ Códigos de erro possíveis
- ✓ Rate limiting
- ✓ Autenticação requirements

---

## 📁 Estrutura do Projeto

```
fiap-mecanica-api/
├── src/
│   ├── domain/                          # Camada de Domínio
│   │   ├── entities/                    # Entidades de negócio
│   │   │   ├── customer.entity.ts
│   │   │   ├── service-order.entity.ts
│   │   │   ├── vehicle.entity.ts
│   │   │   ├── service.entity.ts
│   │   │   └── part.entity.ts
│   │   ├── value-objects/               # Value Objects
│   │   │   ├── money.vo.ts
│   │   │   ├── quantity.vo.ts
│   │   │   └── cpf.vo.ts
│   │   └── exceptions/                  # Exceções de negócio
│   │       ├── service-inactive.exception.ts
│   │       ├── insufficient-stock.exception.ts
│   │       ├── vehicle-ownership.exception.ts
│   │       └── invalid-status-transition.exception.ts
│   │
│   ├── application/                     # Camada de Aplicação
│   │   ├── use-cases/                   # Casos de uso
│   │   │   ├── customer/
│   │   │   │   ├── create-customer.use-case.ts
│   │   │   │   ├── get-customer.use-case.ts
│   │   │   │   ├── list-customers.use-case.ts
│   │   │   │   ├── update-customer.use-case.ts
│   │   │   │   └── delete-customer.use-case.ts
│   │   │   ├── service-order/
│   │   │   │   ├── create-service-order.use-case.ts
│   │   │   │   ├── update-service-order-status.use-case.ts
│   │   │   │   ├── list-service-orders.use-case.ts
│   │   │   │   └── get-service-order.use-case.ts
│   │   │   ├── vehicle/
│   │   │   ├── service/
│   │   │   └── part/
│   │   ├── ports/                       # Interfaces (Inversion of Control)
│   │   │   ├── customer.repository.port.ts
│   │   │   ├── service-order.repository.port.ts
│   │   │   ├── vehicle.repository.port.ts
│   │   │   ├── service.repository.port.ts
│   │   │   └── part.repository.port.ts
│   │   └── dtos/                        # Data Transfer Objects
│   │       ├── customer/
│   │       ├── service-order/
│   │       └── ...
│   │
│   ├── infrastructure/                  # Camada de Infraestrutura
│   │   ├── database/
│   │   │   ├── prisma.service.ts        # Prisma service
│   │   │   └── pg-connection.ts
│   │   ├── repositories/                # Implementações de repositórios
│   │   │   ├── customer.repository.ts
│   │   │   ├── service-order.repository.ts
│   │   │   └── ...
│   │   ├── auth/                        # Autenticação
│   │   │   ├── auth.module.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── services/
│   │   │       └── auth-gateway-client.ts
│   │   ├── config/                      # Configurações
│   │   │   └── secrets-loader.ts
│   │   └── observability/               # Observabilidade
│   │       ├── logger.ts
│   │       ├── metrics.ts
│   │       └── tracing.ts
│   │
│   ├── presentation/                    # Camada de Apresentação
│   │   ├── controllers/                 # Controllers (Rotas)
│   │   │   ├── auth.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── vehicle.controller.ts
│   │   │   ├── service.controller.ts
│   │   │   ├── part.controller.ts
│   │   │   ├── service-order.controller.ts
│   │   │   └── health.controller.ts
│   │   ├── dtos/                        # DTOs para API
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   └── ...
│   │   └── pipes/                       # Pipes de validação
│   │       └── parse-uuid.pipe.ts
│   │
│   ├── modules/                         # NestJS Modules
│   │   ├── app.module.ts
│   │   ├── auth.module.ts
│   │   ├── customer.module.ts
│   │   ├── vehicle.module.ts
│   │   ├── service.module.ts
│   │   ├── part.module.ts
│   │   ├── service-order.module.ts
│   │   └── health.module.ts
│   │
│   ├── shared/                          # Código compartilhado
│   │   ├── exceptions/
│   │   ├── pipes/
│   │   └── decorators/
│   │
│   └── main.ts                          # Entry point
│
├── test/                                # Testes E2E
│   ├── customer.e2e-spec.ts
│   ├── vehicle.e2e-spec.ts
│   ├── service-order.e2e-spec.ts
│   └── jest-e2e.json
│
├── prisma/                              # Prisma ORM
│   ├── schema.prisma                    # Database schema
│   ├── migrations/                      # Database migrations
│   └── seed.ts                          # Seed script
│
├── k8s/                                 # Kubernetes manifests
│   ├── base/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       └── production/
│           ├── ingress.yaml
│           ├── configmap.yaml
│           └── kustomization.yaml
│
├── .github/
│   └── workflows/
│       ├── ci.yml                       # CI pipeline
│       └── cd.yml                       # CD pipeline (auto deploy)
│
├── .env.example                         # Exemplo de env vars
├── Dockerfile                           # Container image
├── docker-compose.yml                   # Local dev stack
├── tsconfig.json                        # TypeScript config
├── jest.config.js                       # Jest config
├── package.json
└── README.md
```

---

## 🧪 Testes

### Estrutura de Testes

```
Cobertura: 381 testes
Sucesso: 100% passing
Arquivos de teste: **/*.spec.ts

Tipos:
1. Unit tests - Lógica de negócio isolada
2. Integration tests - Múltiplas camadas
3. E2E tests - Fluxos completos
```

### Rodando Testes

```bash
# Todos
$ npm test

# Específico
$ npm test customer.spec

# Com coverage
$ npm run test:cov

# Watch mode
$ npm run test:watch
```

---

## 📊 Monitoramento

### Datadog
- **APM**: Rastreamento automático de traces
- **Logs**: Aggregação de logs estruturados
- **Metrics**: Métricas de performance
- **Dashboards**: Painéis customizados

### CloudWatch
- **Logs**: Via AWS SDK
- **Metrics**: Métricas customizadas
- **Alarms**: Alertas automáticos

### X-Ray
- **Service Map**: Visualização de dependências
- **Traces**: Rastreamento distribuído
- **Analytics**: Análise de performance

---

## 🔐 Segurança

✓ JWT Bearer token authentication  
✓ CORS configurado  
✓ SQL injection prevention (Prisma)  
✓ XSS protection via Helmet  
✓ Rate limiting  
✓ Environment variables para secrets  
✓ VPC isolation em produção  
✓ HTTPS enforced

---

## 📞 Suporte

**Documentação Adicional**:
- [Guia de Integração de Auth](../FiapMecanica/AUTH_INTEGRATION_GUIDE.md)
- [Datadog Implementation](../FiapMecanica/DATADOG_IMPLEMENTATION.md)
- [API Gateway Setup](../FiapMecanica/API_GATEWAY_LAMBDA_SETUP.md)

**Issues/Problemas**:
- GitHub Issues: https://github.com/Nuri-an/fiap-mecanica-api/issues

---

**Última Atualização**: 26 de maio de 2026  
**Status**: Production Ready  
**Versão**: 1.0
