import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Task Approval Service",
    version: "1.0.0",
    description:
      "REST API for a team workflow system where tasks are created and approved. Pass the user UUID in the `x-user-id` header to authenticate.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local" }],
  components: {
    parameters: {
      XUserId: {
        name: "x-user-id",
        in: "header",
        required: true,
        description: "UUID of the acting user (from seeded users or POST /api/users)",
        schema: { type: "string", format: "uuid" },
      },
    },
    schemas: {
      Role: { type: "string", enum: ["EMPLOYEE", "TEAM_LEAD", "MANAGER"] },
      TaskStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/Role" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          status: { $ref: "#/components/schemas/TaskStatus" },
          createdBy: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          creator: { $ref: "#/components/schemas/User" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "array", items: { type: "object" } },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          action: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string", format: "uuid" },
          performedBy: { type: "string", format: "uuid" },
          metadata: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          performer: { $ref: "#/components/schemas/User" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Service is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List all users",
        responses: {
          200: {
            description: "All users",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
              },
            },
          },
        },
      },
    },
    "/api/audit-logs": {
      get: {
        tags: ["Audit Logs"],
        summary: "Fetch all audit logs",
        responses: {
          200: {
            description: "All audit logs ordered by most recent",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/AuditLog" } },
              },
            },
          },
        },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "Fetch all tasks",
        parameters: [
          { $ref: "#/components/parameters/XUserId" },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { $ref: "#/components/schemas/TaskStatus" },
            description: "Filter by task status",
          },
        ],
        responses: {
          200: {
            description: "All tasks",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Task" } },
              },
            },
          },
          401: {
            description: "Missing or invalid x-user-id",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a task",
        parameters: [{ $ref: "#/components/parameters/XUserId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", example: "Review PR #42" },
                  description: {
                    type: "string",
                    example: "Please review the authentication changes",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Task created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          401: {
            description: "Missing or invalid x-user-id",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
    },
    "/api/tasks/{id}/approve": {
      post: {
        tags: ["Tasks"],
        summary: "Approve a task (TEAM_LEAD / MANAGER only)",
        parameters: [
          { $ref: "#/components/parameters/XUserId" },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "Task approved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } },
          },
          401: {
            description: "Missing or invalid x-user-id",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          403: {
            description: "Insufficient role or self-approval attempt",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          404: {
            description: "Task not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
    },
    "/api/tasks/{id}/reject": {
      post: {
        tags: ["Tasks"],
        summary: "Reject a task (TEAM_LEAD / MANAGER only)",
        parameters: [
          { $ref: "#/components/parameters/XUserId" },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "Task rejected",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } },
          },
          401: {
            description: "Missing or invalid x-user-id",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          403: {
            description: "Insufficient role or self-rejection attempt",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          404: {
            description: "Task not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
