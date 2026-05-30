# Datadog Dashboards Setup Guide

This guide explains how to create and configure the 4 comprehensive dashboards for monitoring FiapMecanica.

---

## Dashboard Overview

| Dashboard | Purpose | Audience |
|-----------|---------|----------|
| Infrastructure Health | Kubernetes cluster & node metrics | DevOps, SRE |
| API Performance | Request latency, errors, throughput | Engineering, Product |
| Service Order Processing | Business metrics & workflow | Product, Operations |
| System Health & Alerts | Overall system status & alerting | On-call, Management |

---

## Dashboard 1: Infrastructure Health

**Purpose**: Monitor Kubernetes cluster, nodes, and resource usage

### Metrics to Include

1. **Node Health**
   - CPU usage per node
   - Memory usage per node
   - Disk usage per node
   - Network I/O

2. **Pod Status**
   - Pod count by namespace
   - Pod restarts (last 24h)
   - Failed pods
   - Pending pods

3. **Cluster Resources**
   - Total cluster CPU usage
   - Total cluster memory usage
   - Namespace resource breakdown
   - Persistent volume usage

4. **Datadog Agent Health**
   - Datadog agent pods status
   - Agent CPU/memory usage
   - Agent check success rate

### Key Widgets

```
┌─────────────────────────────────────────┐
│ Cluster Overview                         │
├──────────────────┬──────────────────────┤
│ Node CPU Usage   │ Node Memory Usage    │
├──────────────────┼──────────────────────┤
│ Pod Status       │ Resource Breakdown   │
├──────────────────┼──────────────────────┤
│ Network I/O      │ Agent Health         │
└──────────────────┴──────────────────────┘
```

### Creation Steps

1. Go to **Dashboards** → **New Dashboard**
2. Name: `Infrastructure Health - FiapMecanica`
3. Add the following queries:

**CPU Usage by Node**:
```
avg:system.cpu.user{cluster_name:fiap-mecanica-prod} by {host}
```

**Memory Usage by Node**:
```
avg:system.mem.pct{cluster_name:fiap-mecanica-prod} by {host}
```

**Pod Count**:
```
count:kubernetes.pods{cluster_name:fiap-mecanica-prod} by {namespace}
```

**Pod Restarts**:
```
max:kubernetes.containers.restarts{cluster_name:fiap-mecanica-prod}
```

**Network I/O**:
```
avg:system.net.bytes_rcvd{cluster_name:fiap-mecanica-prod} by {host}
avg:system.net.bytes_sent{cluster_name:fiap-mecanica-prod} by {host}
```

---

## Dashboard 2: API Performance

**Purpose**: Monitor NestJS API health, response times, and errors

### Metrics to Include

1. **Request Metrics**
   - Requests per second (throughput)
   - Average response time (p50, p95, p99)
   - Error rate (%)
   - Status code breakdown (2xx, 4xx, 5xx)

2. **Endpoint Performance**
   - Top 10 slowest endpoints
   - Endpoints with most errors
   - Traffic by endpoint

3. **Database Performance**
   - Query count
   - Average query time
   - Slow queries (>100ms)
   - Connection pool usage

4. **Error Tracking**
   - Error rate trend
   - Top error types
   - Error stack traces

### Key Widgets

```
┌─────────────────────────────────────────┐
│ API Health Dashboard                    │
├──────────────────┬──────────────────────┤
│ Throughput (RPS) │ Response Time (ms)   │
├──────────────────┼──────────────────────┤
│ Error Rate (%)   │ Status Distribution  │
├──────────────────┼──────────────────────┤
│ Top Slow Endpoints                      │
├──────────────────┼──────────────────────┤
│ Database Queries │ Connection Pool      │
└──────────────────┴──────────────────────┘
```

### Creation Steps

1. Go to **Dashboards** → **New Dashboard**
2. Name: `API Performance - FiapMecanica`
3. Add the following queries:

**Requests Per Second**:
```
sum:trace.web.request.count{service:fiap-mecanica-api}.as_count()
```

**Response Time (P95)**:
```
p95:trace.web.request.duration{service:fiap-mecanica-api}
```

**Error Rate**:
```
sum:trace.web.request.errors{service:fiap-mecanica-api}.as_count() / sum:trace.web.request.count{service:fiap-mecanica-api}.as_count() * 100
```

**Status Code Distribution**:
```
sum:trace.web.request.count{service:fiap-mecanica-api} by {http.status_code}
```

**Top Slowest Endpoints**:
```
avg:trace.web.request.duration{service:fiap-mecanica-api} by {http.route}
```

**Database Query Time**:
```
avg:trace.postgres.query.duration{service:fiap-mecanica-api}
```

---

## Dashboard 3: Service Order Processing

**Purpose**: Monitor business workflows and service order metrics

### Metrics to Include

1. **Service Order Flow**
   - Total orders created (daily)
   - Orders by status (pending, in-progress, completed)
   - Average time to complete order
   - Completion rate (%)

2. **Order Performance**
   - Orders created per hour
   - Average order value (if tracked)
   - Orders with errors
   - Customer satisfaction (if available)

3. **Mechanical Workflow**
   - Services completed (daily)
   - Parts consumed (daily)
   - Mechanics utilization
   - Queue length (pending orders)

4. **Trend Analysis**
   - 7-day order trend
   - Busiest hours
   - Service category distribution

### Key Widgets

```
┌─────────────────────────────────────────┐
│ Service Order Dashboard                 │
├──────────────────┬──────────────────────┤
│ Orders Today     │ Completion Rate      │
├──────────────────┼──────────────────────┤
│ By Status        │ Avg Time to Complete │
├──────────────────┼──────────────────────┤
│ 7-Day Trend      │ Busiest Hours        │
├──────────────────┼──────────────────────┤
│ Queue Length     │ Services Completed   │
└──────────────────┴──────────────────────┘
```

### Creation Steps

1. Go to **Dashboards** → **New Dashboard**
2. Name: `Service Order Processing - FiapMecanica`
3. Add custom metrics (these would need to be instrumented in your code):

**Custom Metric Example - Service Order Created**:
```typescript
import tracer from 'dd-trace';

const span = tracer.scope().active().span();
span.setTag('service_order.id', orderId);
span.setTag('service_order.status', 'created');
span.setTag('service_order.customer_id', customerId);

// Increment custom metric
tracer.increment('service_order.created');
```

**Queries for Custom Metrics**:

```
sum:service_order.created{}.as_count()  // Total orders created today
```

```
avg:service_order.completion_time{status:completed}  // Avg time to complete
```

```
sum:service_order.count{status:pending}  // Pending orders queue
```

---

## Dashboard 4: System Health & Alerts

**Purpose**: Overall system status and alert summary

### Metrics to Include

1. **System Status**
   - All services green/red/yellow
   - Uptime % (24h, 7d, 30d)
   - SLA compliance
   - Last incident timestamp

2. **Alert Status**
   - Active alerts count
   - Alert trend
   - Most triggered alerts
   - Alert resolution time

3. **Dependency Health**
   - Database availability
   - External API health
   - Message queue status
   - Cache (if applicable)

4. **Business Impact**
   - Revenue impact (if tracked)
   - Affected users count
   - Customer complaints (if tracked)

### Key Widgets

```
┌─────────────────────────────────────────┐
│ System Health & Alerts                  │
├──────────────────┬──────────────────────┤
│ Overall Status   │ Uptime (%)           │
├──────────────────┼──────────────────────┤
│ Active Alerts    │ SLA Compliance       │
├──────────────────┼──────────────────────┤
│ Database Health  │ API Gateway Health   │
├──────────────────┼──────────────────────┤
│ Error Trend      │ Performance Trend    │
└──────────────────┴──────────────────────┘
```

### Creation Steps

1. Go to **Dashboards** → **New Dashboard**
2. Name: `System Health & Alerts - FiapMecanica`
3. Add the following:

**Service Status Card**:
```
Create 4 separate status cards:
- fiap-mecanica-api: avg:trace.web.request.errors{service:fiap-mecanica-api}.as_count() == 0
- Database: avg:trace.postgres.query.errors{service:fiap-mecanica-api}.as_count() == 0
- Kubernetes: count:kubernetes.containers.status_code_error{cluster_name:fiap-mecanica-prod} == 0
- Datadog Agent: count:datadog.agent.running{cluster_name:fiap-mecanica-prod} > 0
```

**Uptime Calculation**:
```
sum:trace.web.request.count{service:fiap-mecanica-api}.as_count() - sum:trace.web.request.errors{service:fiap-mecanica-api}.as_count() / sum:trace.web.request.count{service:fiap-mecanica-api}.as_count() * 100
```

**Active Alerts**:
```
Use Monitors widget to show all active monitor alerts
```

**Error Trend**:
```
sum:trace.web.request.errors{service:fiap-mecanica-api}.as_count()
```

---

## Setting Up Alerts

### Critical Alerts to Create

1. **High Error Rate**
   ```
   Condition: avg:trace.web.request.errors{service:fiap-mecanica-api}.as_count() > 10
   Duration: 5 minutes
   Severity: Critical
   ```

2. **High Latency**
   ```
   Condition: p99:trace.web.request.duration{service:fiap-mecanica-api} > 500
   Duration: 5 minutes
   Severity: Warning
   ```

3. **Service Down**
   ```
   Condition: sum:trace.web.request.count{service:fiap-mecanica-api}.as_count() == 0
   Duration: 1 minute
   Severity: Critical
   ```

4. **High CPU Usage**
   ```
   Condition: avg:system.cpu.user{cluster_name:fiap-mecanica-prod} > 80
   Duration: 10 minutes
   Severity: Warning
   ```

5. **Pod Restarts**
   ```
   Condition: max:kubernetes.containers.restarts{cluster_name:fiap-mecanica-prod} > 5
   Duration: 5 minutes
   Severity: Warning
   ```

---

## Dashboard Sharing

### Export Dashboards

1. Click **Dashboard Settings** (gear icon)
2. Click **Export Dashboard**
3. Choose format (JSON for version control)
4. Save in repository under `k8s/datadog/dashboards/`

### Share Dashboards

1. Click **Share Dashboard** button
2. Select **Share by link** or **Team**
3. Set permissions (read-only or edit)
4. Copy link for team members

---

## Dashboard Best Practices

1. **Keep it focused**: Each dashboard should have a single purpose
2. **Use colors**: Red = critical, yellow = warning, green = healthy
3. **Add context**: Include runbooks and troubleshooting links
4. **Update regularly**: Review and refresh dashboards quarterly
5. **Monitor the monitors**: Set up alerts for dashboard metrics

---

## Datadog Terraform (Optional)

If you want to manage dashboards as code:

```hcl
# Save as terraform/dashboards.tf

resource "datadog_dashboard" "api_performance" {
  title       = "API Performance - FiapMecanica"
  layout_type = "ordered"
  
  widget {
    timeseries_definition {
      request {
        query = "sum:trace.web.request.count{service:fiap-mecanica-api}.as_count()"
        display_type = "line"
      }
    }
  }
}
```

---

## Next Steps

1. Create the 4 dashboards in Datadog UI
2. Configure alerts for each dashboard
3. Share dashboards with team
4. Set up dashboard notifications
5. Export dashboards as JSON
6. Add runbook links to critical metrics

---

**Status**: Ready for dashboard creation
**Last Updated**: 2026-05-27
