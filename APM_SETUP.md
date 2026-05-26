# APM Setup with Datadog dd-trace

## Overview

This document explains the Application Performance Monitoring (APM) setup for the FiapMecanica API using Datadog's `dd-trace` library.

---

## Installation

The `dd-trace` package has been installed as a production dependency:

```bash
npm install dd-trace
```

---

## Configuration

### 1. Main.ts Initialization

The `dd-trace` library is initialized at the very beginning of `src/main.ts`, **before any other imports**. This is critical for proper instrumentation.

```typescript
import tracer from 'dd-trace';

tracer.init({
  service: process.env.DD_SERVICE || 'fiap-mecanica-api',
  env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
  version: process.env.DD_VERSION || '1.0.0',
  logInjection: true,
  analytics: true,
  runtimeMetrics: true,
});
```

#### Configuration Options:

- **service**: The name of the service (default: `fiap-mecanica-api`)
- **env**: Environment name (default: development)
- **version**: Application version
- **logInjection**: Injects trace IDs into logs for correlation
- **analytics**: Enables APM Analytics for sampling
- **runtimeMetrics**: Collects Node.js runtime metrics

### 2. Kubernetes Environment Variables

The deployment is configured with the following Datadog environment variables:

```yaml
env:
  - name: DD_SERVICE
    value: "fiap-mecanica-api"
  - name: DD_ENV
    value: "production"
  - name: DD_VERSION
    value: "1.0.0"
  - name: DD_AGENT_HOST
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
  - name: DD_AGENT_PORT
    value: "8126"
  - name: DD_TRACE_SAMPLE_RATE
    value: "1"
  - name: DD_LOGS_INJECTION
    value: "true"
```

- **DD_AGENT_HOST**: Points to the Datadog Agent on the host node
- **DD_AGENT_PORT**: Default Datadog Agent port for traces (8126)
- **DD_TRACE_SAMPLE_RATE**: Sample rate for traces (1 = 100%, 0.5 = 50%, etc.)
- **DD_LOGS_INJECTION**: Enables log correlation with traces

---

## Automatic Instrumentation

dd-trace automatically instruments the following NestJS and popular libraries:

### Web Frameworks
- **Express** (used by NestJS)
- **Fastify**

### Databases
- **PostgreSQL** (via `pg`)
- **Prisma ORM**

### HTTP Clients
- **Axios** (already in use)
- **http/https** (Node.js built-in)

### Other
- **JSON serialization**
- **Database queries**

---

## Viewing Traces in Datadog

### 1. Access the APM Dashboard

1. Log in to your Datadog dashboard at https://app.datadoghq.eu (EU site)
2. Navigate to **APM** → **Service Catalog**
3. Look for the **fiap-mecanica-api** service

### 2. View Service Details

- **Traces**: All requests traced with latency, errors, and status codes
- **Metrics**: Service latency, throughput (requests/second), error rate
- **Dependencies**: Shows communication with PostgreSQL, other services
- **Logs**: Integration of logs with traces via trace ID correlation

### 3. Example Trace Flow

When a request comes in:
```
Request → Express Middleware → NestJS Controllers 
  → Use Cases → Prisma ORM → PostgreSQL → Response
```

Each step is automatically traced and shows timing information.

---

## Log Correlation

With `logInjection: true`, all logs automatically include trace IDs:

```typescript
logger.info('User created successfully'); 
// Output: {"message":"User created successfully","dd.trace_id":"1234567890","dd.span_id":"0987654321"}
```

This allows you to:
- Click on a trace in Datadog to see all related logs
- Filter logs by trace ID
- See error context across logs and traces

---

## Local Development

For local development without Datadog Agent:

```bash
# Disable tracing
DD_TRACE_ENABLED=false npm run start:dev
```

Or use a local Datadog Agent via Docker Compose (optional setup).

---

## Performance Impact

- **Minimal overhead**: ~1-2% CPU increase
- **Memory overhead**: ~10-15MB
- **Network**: Traces batched and sent asynchronously (no request blocking)

---

## Troubleshooting

### Traces Not Appearing

1. **Check Datadog Agent is running**:
   ```bash
   kubectl get pods -n datadog
   ```

2. **Verify Agent connectivity**:
   ```bash
   curl http://$(kubectl get node -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}'):8126/v0.4/traces
   ```

3. **Check environment variables in pod**:
   ```bash
   kubectl exec -it <pod-name> -n fiap-mecanica -- env | grep DD_
   ```

4. **View application logs for dd-trace**:
   ```bash
   kubectl logs <pod-name> -n fiap-mecanica | grep -i "trace\|dd-trace"
   ```

### High Memory Usage

- Reduce `DD_TRACE_SAMPLE_RATE` (e.g., `0.1` for 10%)
- Disable analytics: `analytics: false` in tracer.init()

### Slow Requests

- This is usually NOT caused by dd-trace (overhead ~1-2%)
- Check actual application code or database queries
- Use Datadog to find slow spans

---

## Advanced Configuration

### Custom Span Tagging

```typescript
import tracer from 'dd-trace';

const span = tracer.scope().active().span();
span.setTag('user_id', userId);
span.setTag('order_id', orderId);
```

### Manual Instrumentation

```typescript
import tracer from 'dd-trace';

const span = tracer.startSpan('custom_operation');
try {
  // Your code
} finally {
  span.finish();
}
```

---

## Monitoring Alerts

Recommended alerts to set up in Datadog:

1. **High Error Rate**: Alert if error rate > 1%
2. **High Latency**: Alert if p99 latency > 500ms
3. **Low Throughput**: Alert if requests/sec < expected
4. **Service Down**: Alert if service stops sending traces

---

## Next Steps

1. Deploy updated API with dd-trace
2. Generate traffic to the API
3. Check Datadog APM dashboard for traces
4. Create custom dashboards for monitoring
5. Set up alerts for production issues

---

**Status**: ✅ Configured and ready for deployment
**Last Updated**: 2026-05-27
