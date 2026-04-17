# Task Approval Service

A backend REST API for a team workflow system where tasks are created and approved.

## Requirements

- [Docker](https://www.docker.com/) and Docker Compose

## Local Setup (for development / IDE support)

If you're working on the code locally and want proper TypeScript intellisense and no editor errors, install dependencies first:

```bash
npm install
```

> This is only needed for your editor (type checking, autocomplete). The app itself runs entirely inside Docker.

## Running the Project

### First time / fresh start

```bash
docker compose up --build
```

This will:
1. Build the app image
2. Start PostgreSQL and wait for it to be healthy
3. Run Prisma migrations (`prisma migrate deploy`)
4. Seed the database with default users
5. Start the server on `http://localhost:3000`

### Subsequent runs (no rebuild needed)

```bash
docker compose up
```

### Tear down (keeps DB data)

```bash
docker compose down
```

### Tear down and wipe the database volume

```bash
docker compose down -v
```

### View apis built
[Visit swagger page](http://localhost:3000/api-docs/)

## Default Seeded Users

These users are available immediately after startup:

| Name          | Email                | Role      |
|---------------|----------------------|-----------|
| Admin User    | admin@taskapp.com    | MANAGER   |
| Lead User     | lead@taskapp.com     | TEAM_LEAD |
| John Doe | johndoe@taskapp.com | EMPLOYEE  |

Use the `id` of any seeded user as the `x-user-id` header in requests.

## Health Check

Once the app is running, verify it's up with:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Environment Variables

| Variable       | Default                                              | Description          |
|----------------|------------------------------------------------------|----------------------|
| `DATABASE_URL` | `postgresql://taskuser:taskpass@db:5432/taskdb`      | Postgres connection  |
| `PORT`         | `3000`                                               | Server port          |

See `.env.example` for local development setup.
