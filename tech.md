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
| value  | INTEGER    | Default: 0                 |
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

User identity is determined by `x-user-id` header passed with each request. The user's role is looked up from the database.

### User Management

| Method | Endpoint    | Roles | Description    |
|--------|-------------|-------|----------------|
| POST   | /api/users  | *     | Create a user  |

#### Create User
Request: `{ "name": string, "email": string, "role"?: "EMPLOYEE" | "TEAM_LEAD" | "MANAGER" }`
- `role` defaults to `EMPLOYEE` if not provided

### Task Management

| Method | Endpoint               | Roles              | Description       |
|--------|------------------------|--------------------|-------------------|
| POST   | /api/tasks             | *                  | Create a task     |
| POST   | /api/tasks/search      | *                  | List/filter tasks |
| POST   | /api/tasks/:id/approve | TEAM_LEAD, MANAGER | Approve a task    |
| POST   | /api/tasks/:id/reject  | TEAM_LEAD, MANAGER | Reject a task     |

#### Create Task
Request: `{ "title": string, "description"?: string }`
- `status` defaults to `PENDING`
- `createdBy` is set from the `x-user-id` header

#### List Tasks (Search)
Request: `{ "title"?: string, "description"?: string, "status"?: string, "createdBy"?: string, "page"?: number, "limit"?: number }`
- All filters are optional, returns matching tasks
- POST method chosen to support complex filter payloads
- `page` defaults to `1`, `limit` defaults to `20`
- Response includes `{ data: Task[], total: number, page: number, limit: number }`

#### Approve Task
`POST /api/tasks/:id/approve`
- Only `TEAM_LEAD` and `MANAGER` can approve
- Cannot approve an already `APPROVED` or `REJECTED` task
- Cannot approve a task you created (self-approval is forbidden)

#### Reject Task
`POST /api/tasks/:id/reject`
- Only `TEAM_LEAD` and `MANAGER` can reject
- Cannot reject an already `APPROVED` or `REJECTED` task
- Cannot reject a task you created (self-rejection is forbidden)

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
