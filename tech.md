# Task Approval Service — Technical Design

## Tech Stack

Runtime: Node.js (v22)
Language: TypeScript
Framework: Express.js
Database: PostgreSQL
ORM: Prisma
Validation: Zod
Testing: Jest + Supertest
Containerization: Docker
Linting/Formatting: Biome
Git Hooks: Husky

## Roles

| Role        | Value       |
|-------------|-------------|
| Employee    | `EMPLOYEE`  |
| Team Lead   | `TEAM_LEAD` |
| Manager     | `MANAGER`   |

## Database Schema

### users

| Column     | Type         | Notes                          |
|------------|--------------|--------------------------------|
| id         | UUID (PK)    | Auto-generated                 |
| email      | VARCHAR(255) | Unique, required               |
| name       | VARCHAR(255) | Required                       |
| role       | ENUM         | EMPLOYEE, TEAM_LEAD, MANAGER   |
| created_at | TIMESTAMP    | Default: now()                 |

### tasks

| Column      | Type         | Notes                          |
|-------------|--------------|--------------------------------|
| id          | UUID (PK)    | Auto-generated                 |
| title       | VARCHAR(255) | Required, non-empty            |
| description | TEXT         | Optional                       |
| status      | ENUM         | PENDING, APPROVED, REJECTED    |
| created_by  | UUID (FK)    | References users.id            |
| created_at  | TIMESTAMP    | Default: now()                 |
| version  | INTEGER    | Default: 0                 |
| updated_at  | TIMESTAMP    | Auto-updated                   |

### audit_logs

| Column      | Type         | Notes                          |
|-------------|--------------|--------------------------------|
| id          | UUID (PK)    | Auto-generated                 |
| action      | VARCHAR(100) | e.g. TASK_CREATED, TASK_APPROVED, TASK_REJECTED, USER_CREATED |
| entity_type | VARCHAR(50)  | e.g. TASK, USER               |
| entity_id   | UUID         | ID of the affected record      |
| performed_by| UUID (FK)    | References users.id            |
| metadata    | JSONB        | Optional extra context         |
| created_at  | TIMESTAMP    | Default: now()                 |

## API Design

### User Management

| Method | Endpoint    | Roles | Description    |
|--------|-------------|-------|----------------|
| POST   | /api/users  | *     | Create a user  |

### Task Management

| Method | Endpoint               | Roles              | Description       |
|--------|------------------------|--------------------|-------------------|
| GET   | /api/tasks             | *                  | Fetch all task     |
| POST   | /api/tasks             | *                  | Create a task     |
| POST   | /api/tasks/:id/approve | TEAM_LEAD, MANAGER | Approve a task    |
| POST   | /api/tasks/:id/reject  | TEAM_LEAD, MANAGER | Reject a task     |

#### Create Task
Request: `{ "title": string, "description"?: string }`
- `status` defaults to `PENDING`
- `createdBy` is set from the `x-user-id` header
- 
#### Approve Task
`POST /api/tasks/:id/approve`
- Only `TEAM_LEAD` and `MANAGER` can approve
- Cannot approve an already `APPROVED` or `REJECTED` task

#### Reject Task
`POST /api/tasks/:id/reject`
- Only `TEAM_LEAD` and `MANAGER` can reject
- Cannot reject an already `APPROVED` or `REJECTED` task

## Project Structure

```
src/
├── app.ts                  # Express app setup
├── server.ts               # Entry point
├── config/
│   └── index.ts            # Env vars, DB config
├── middleware/
│   ├── userContext.ts       # Extract user from x-user-id header
│   ├── authorize.ts        # Role-based access
│   └── errorHandler.ts     # Global error handler
├── routes/
│   └── task.routes.ts
├── controllers/
│   └── task.controller.ts
├── services/
│   ├── task.service.ts
│   └── audit.service.ts
├── repositories/
│   ├── user.repository.ts
│   ├── task.repository.ts
│   └── audit.repository.ts
├── validators/
│   └── task.validator.ts
├── types/
│   └── index.ts            # Shared types, enums
└── errors/
    └── index.ts            # Custom error classes
prisma/
├── schema.prisma
tests/
├── task.test.ts
```

## Layer Separation

| Layer        | Responsibility                              |
|--------------|---------------------------------------------|
| Routes       | HTTP method + path mapping                  |
| Controllers  | Parse request, call service, send response  |
| Services     | Business logic, validation rules            |
| Repositories | Database queries via Prisma                 |
| Middleware   | User context extraction, role authorization, error handling |
| Validators   | Input schema validation (zod)               |

## Seeding

A few default users will be seeded so the system can be used immediately.

```
| Name          | Email                | Role      |
|---------------|----------------------|-----------|
| Admin User    | admin@taskapp.com    | MANAGER   |
| Lead User     | lead@taskapp.com     | TEAM_LEAD |
| John DOe | johndoe@taskapp.com | EMPLOYEE  |
```

## Additional Considerations

### Audit Logging
- Every create/update action writes to `audit_logs` table
- Logs capture: who did what, to which entity, and when
- `metadata` JSONB field stores before/after state for status changes

### Error Handling
- Centralized error handler middleware
- Custom error classes (ValidationError, UnauthorizedError, ForbiddenError, NotFoundError)
- Consistent error response format: `{ "error": string, "details"?: any }`

### Security
- Role checked on every protected route via middleware
- No employee can approve / reject their own task

## Design Decisions

1. **Self-approval prevention** — An employee cannot approve or reject their own task. Only `TEAM_LEAD` and `MANAGER` roles can approve/reject.
2. **Immutability** — Both `APPROVED` and `REJECTED` tasks are immutable.
3. **Optimistic locking** — Tasks use a `version` column to prevent concurrent approval/rejection conflicts. The update only succeeds if the version matches, ensuring atomic state transitions.
4. **Duplicate task prevention** — Task titles are checked case-insensitively before creation to prevent duplicates.

## Scaling to Production

### 1. Authentication & Authorization
**Current**: Header-based `x-user-id` (trust-based, no verification)

**Production**:
- JWT tokens with signature verification
- OAuth2/OIDC integration (Auth0, Cognito, Keycloak)
- API Gateway handling auth upstream
- Service-to-service auth for internal calls

### 2. Database
**Current**: Single Postgres instance

**Production**:
- **Connection pooling**: PgBouncer or RDS Proxy (Prisma's pool is per-instance)
- **Read replicas**: Route `GET /api/tasks` to replicas, writes to primary
- **Indexes**: Add indexes on `tasks.status`, `tasks.created_by`, `audit_logs.created_at`
- **Partitioning**: Partition `audit_logs` by month for long-term retention
- **Backups**: Automated daily snapshots + point-in-time recovery

### 3. Horizontal Scaling
**Current**: Single container

**Production**:
- **Continue Stateless design**
- **Load balancer**: ALB/NLB distributing across multiple instances
- **Auto-scaling**: Scale pods/containers based on CPU/memory/request rate
- **Health checks**: `/health` endpoint already exists — use it for readiness probes

### 4. Caching
**Current**: Every request hits the DB

**Production**:
- **Redis** for frequently accessed data:
  - User lookups (cache `findById` results with 5-10min TTL)
  - Task lists (invalidate on create/approve/reject)
- **CDN** for Swagger UI static assets

### 5. Rate Limiting
**Current**: None

**Production**:
- Per-user rate limits (e.g., 100 req/min per user)
- Per-IP rate limits at API Gateway/load balancer
- Prevents abuse and DoS

### 6. Observability
**Current**: `console.error` only

**Production**:
- **Structured logging**: Winston/Pino with JSON output
- **Centralized logs**: CloudWatch, Datadog, ELK stack
- **Metrics**: Prometheus + Grafana (request rate, latency, error rate)
- **Tracing**: OpenTelemetry or AWS X-Ray for distributed tracing
- **Alerting**: PagerDuty/Opsgenie for critical errors

### 7. Error Handling & Resilience
**Current**: Basic error middleware

**Production**:
- **Retry logic**: Exponential backoff for transient DB failures
- **Circuit breakers**: Fail fast when downstream services are down
- **Graceful degradation**: Return cached data if DB is slow
- **Timeouts**: Set query timeouts (Prisma supports this)

### 8. Security
**Current**: Minimal

**Production**:
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options)
- **CORS**: Restrict origins
- **Input sanitization**: Already using Zod, Prisma prevents SQL injection
- **Secrets management**: AWS Secrets Manager / Vault for `DATABASE_URL`
- **TLS**: Enforce HTTPS everywhere
- **Audit log retention**: Compliance-driven retention policies

### 9. API Versioning
**Current**: No versioning

**Production**:
- URL-based: `/api/v1/tasks`, `/api/v2/tasks`
- Header-based: `Accept: application/vnd.taskapp.v1+json`
- Allows breaking changes without disrupting clients

### 10. Concurrency & Locking
**Current**: Optimistic locking with version

**Production**:
- Already handled well with version column
- Consider **distributed locks** (Redis) if adding background jobs that process tasks

### 11. Background Jobs
**Current**: Synchronous audit logging

**Production**:
- **Message queue** (SQS, RabbitMQ, Kafka) for async audit writes
- **Worker processes** consuming from queue
- Reduces latency on approve/reject endpoints

### 12. Testing
**Current**: Unit tests with mocked Prisma ✓

**Production**:
- **Integration tests**: Real DB (test container with Docker Compose)
- **E2E tests**: Full API flow tests
- **Load tests**: k6, Artillery, or Locust to find bottlenecks
- **CI/CD**: Run tests on every PR

### 13. Database Migrations
**Current**: `prisma migrate deploy` on container start

**Production**:
- **Separate migration job**: Run migrations before deploying new code
- **Blue-green deployments**: Zero-downtime deploys
- **Rollback strategy**: Keep old schema compatible during transition

### 14. Monitoring & SLOs
**Production**:
- **SLIs**: Latency (p50, p95, p99), error rate, availability
- **SLOs**: e.g., "99.9% of requests < 200ms, 99.95% uptime"
- **Dashboards**: Real-time metrics for on-call engineers

### 15. Cost Optimization
**Production**:
- **Right-size instances**: Don't over-provision
- **Spot instances** for non-critical workloads
- **DB query optimization**: Use `EXPLAIN ANALYZE` to find slow queries
- **Archive old audit logs**: Move to S3/Glacier after 90 days

### 16. Compliance & Data Privacy
**Production**:
- **GDPR/CCPA**: User data deletion endpoints
- **Encryption at rest**: RDS encryption
- **Encryption in transit**: TLS 1.2+
- **Audit log immutability**: Write-once storage for compliance
