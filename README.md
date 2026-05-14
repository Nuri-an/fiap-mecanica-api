# Automotive Workshop Management System — API

Main application for the Integrated Service Management System. Runs on Kubernetes and exposes the REST API consumed by clients and the authentication Lambda.

## Phase 3 — Security, Scalability & Observability

This phase evolves the system to corporate-level operation:

- **CPF-based authentication** via Lambda (Serverless) + API Gateway
- **JWT-protected routes** for all administrative operations
- **Public routes** for customer tracking and budget approval
- **Kubernetes deployment** with HPA auto-scaling (2–5 replicas)
- **CI/CD pipeline** with automated test, build, and deploy stages
- **Structured logging** ready for observability integration

## Architecture

The project follows **Hexagonal Architecture** (Ports and Adapters):

```
src/
├── domain/           # Entities and value objects (CPF, Email, license plate)
├── application/      # Use cases and repository/service interfaces
├── infrastructure/   # Prisma repositories, auth, notifications
├── presentation/     # REST controllers and DTOs
└── modules/          # NestJS modules
```

### Authentication Flow

```
Client sends CPF
      ↓
Auth Lambda (Julio's repo)
  - Validates CPF
  - Checks customer in DB
  - Returns signed JWT
      ↓
Client calls protected API with JWT in header
      ↓
This app validates JWT and processes request
```

## Technologies

- Node.js 20+ / NestJS 10+ / TypeScript 5+
- Prisma ORM 5+ / PostgreSQL 16+
- JWT authentication / bcrypt
- Swagger (API docs)
- Jest (unit + E2E tests)
- Docker / Kubernetes / Terraform
- GitHub Actions (CI/CD)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Quick Setup

```bash
chmod +x run.sh
./run.sh
```

### Manual Setup

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Start database
docker-compose up -d postgres

# Run migrations
npm run prisma:generate
npm run prisma:migrate

# Start in development mode
npm run start:dev
```

### Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://workshop:workshop123@localhost:5432/workshop_db?schema=public"
JWT_SECRET=your-secret-shared-with-lambda
JWT_EXPIRATION=24h
API_PREFIX=api/v1
```

> `JWT_SECRET` must match the secret used by the Auth Lambda to sign tokens.

### Accessing the Application

- **API**: http://localhost:3000/api/v1
- **Swagger**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

## API Endpoints

### Public (no authentication required)

| Method | Route                                       | Description                     |
| ------ | ------------------------------------------- | ------------------------------- |
| GET    | /api/v1/health                              | Health check                    |
| GET    | /api/v1/service-orders                      | List orders (customer tracking) |
| GET    | /api/v1/service-orders/:id                  | Get order by ID                 |
| POST   | /api/v1/service-orders/:id/approve          | Approve/reject budget           |
| POST   | /api/v1/service-orders/notify/status-update | Status update webhook           |

### Protected (JWT required)

| Method | Route                                    | Description          |
| ------ | ---------------------------------------- | -------------------- |
| POST   | /api/v1/customers                        | Create customer      |
| GET    | /api/v1/customers                        | List customers       |
| PUT    | /api/v1/customers/:id                    | Update customer      |
| DELETE | /api/v1/customers/:id                    | Delete customer      |
| POST   | /api/v1/service-orders                   | Create service order |
| PUT    | /api/v1/service-orders/:id/status        | Update status        |
| GET    | /api/v1/service-orders/metrics/execution | Execution metrics    |

Full interactive documentation: **http://localhost:3000/api/docs**

## Kubernetes Deployment

```bash
# Build image
docker build -t fiap-mecanica:latest .

# Create Kind cluster
cat <<EOF | kind create cluster --name fiap-mecanica-cluster --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 30000
    protocol: TCP
- role: worker
EOF

# Load image and apply manifests
kind load docker-image fiap-mecanica:latest --name fiap-mecanica-cluster
kubectl apply -k k8s/

# Verify
kubectl get pods -n fiap-mecanica
kubectl get hpa -n fiap-mecanica
```

### Kubernetes Resources

| Resource              | Description                                   |
| --------------------- | --------------------------------------------- |
| Namespace             | `fiap-mecanica`                               |
| ConfigMap             | Non-secret configuration                      |
| Secret                | JWT secret, DB credentials                    |
| PVC                   | 1Gi PostgreSQL storage                        |
| PostgreSQL Deployment | 1 replica with health probes                  |
| App Deployment        | 2 replicas                                    |
| App Service           | NodePort on port 30000                        |
| HPA                   | Auto-scale 2–5 replicas (CPU 70%, Memory 80%) |

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

| Event             | Test | Build | Deploy |
| ----------------- | ---- | ----- | ------ |
| Push to `main`    | ✅   | ✅    | ✅     |
| Push to `develop` | ✅   | ❌    | ❌     |
| PR to `main`      | ✅   | ❌    | ❌     |

## Testing

```bash
# Unit tests
npm test

# With coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Related Repositories

| Repository                | Description                                 |
| ------------------------- | ------------------------------------------- |
| fiap-mecanica-api         | This repository — Main application          |
| fiap-mecanica-k8s         | Kubernetes infrastructure (Terraform)       |
| fiap-mecanica-db          | Managed database infrastructure (Terraform) |
| fiap-mecanica-auth-lambda | Serverless authentication function          |

## Authors

FIAP Tech Challenge — Software Architecture Postgraduate Program
