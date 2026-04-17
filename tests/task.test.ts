import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config";

jest.mock("../src/config", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    task: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $executeRaw: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const EMPLOYEE = { id: "user-employee", name: "Employee User", email: "employee@taskapp.com", role: "EMPLOYEE" };
const LEAD     = { id: "user-lead",     name: "Lead User",     email: "lead@taskapp.com",     role: "TEAM_LEAD" };

const baseTask = {
  id: "task-1",
  title: "Fix login bug",
  description: null,
  status: "PENDING",
  version: 0,
  createdBy: EMPLOYEE.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  creator: EMPLOYEE,
};

beforeEach(() => jest.clearAllMocks());

describe("GET /api/tasks", () => {
  it("returns all tasks when no status filter", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(EMPLOYEE);
    (mockPrisma.task.findMany as jest.Mock).mockResolvedValue([baseTask]);

    const res = await request(app)
      .get("/api/tasks")
      .set("x-user-id", EMPLOYEE.id);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Fix login bug");
  });

  it("filters tasks by status query param", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(EMPLOYEE);
    (mockPrisma.task.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get("/api/tasks?status=APPROVED")
      .set("x-user-id", EMPLOYEE.id);

    expect(res.status).toBe(200);
    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "APPROVED" } }),
    );
  });
});

describe("POST /api/tasks", () => {
  it("creates a task successfully", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(EMPLOYEE);
    (mockPrisma.task.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.task.create as jest.Mock).mockResolvedValue(baseTask);
    (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post("/api/tasks")
      .set("x-user-id", EMPLOYEE.id)
      .send({ title: "Fix login bug" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Fix login bug");
    expect(res.body.status).toBe("PENDING");
  });

  it("returns 400 when title is missing", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(EMPLOYEE);

    const res = await request(app)
      .post("/api/tasks")
      .set("x-user-id", EMPLOYEE.id)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("POST /api/tasks/:id/approve", () => {
  it("approves a pending task", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(LEAD);
    (mockPrisma.task.findUnique as jest.Mock)
      .mockResolvedValueOnce(baseTask)
      .mockResolvedValueOnce({ ...baseTask, status: "APPROVED" });
    (mockPrisma.$executeRaw as jest.Mock).mockResolvedValue(1);
    (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post("/api/tasks/task-1/approve")
      .set("x-user-id", LEAD.id);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("returns 403 when an EMPLOYEE tries to approve", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(EMPLOYEE);

    const res = await request(app)
      .post("/api/tasks/task-1/approve")
      .set("x-user-id", EMPLOYEE.id);

    expect(res.status).toBe(403);
  });

  it("returns 409 for concurrent update", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(LEAD);
    (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(baseTask);
    (mockPrisma.$executeRaw as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .post("/api/tasks/task-1/approve")
      .set("x-user-id", LEAD.id);

    expect(res.status).toBe(409);
  });
});

describe("POST /api/tasks/:id/reject", () => {
  it("rejects a pending task", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(LEAD);
    (mockPrisma.task.findUnique as jest.Mock)
      .mockResolvedValueOnce(baseTask)
      .mockResolvedValueOnce({ ...baseTask, status: "REJECTED" });
    (mockPrisma.$executeRaw as jest.Mock).mockResolvedValue(1);
    (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post("/api/tasks/task-1/reject")
      .set("x-user-id", LEAD.id);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REJECTED");
  });

  it("returns 403 when an EMPLOYEE tries to reject", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(EMPLOYEE);

    const res = await request(app)
      .post("/api/tasks/task-1/reject")
      .set("x-user-id", EMPLOYEE.id);

    expect(res.status).toBe(403);
  });

  it("returns 409 for concurrent update", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(LEAD);
    (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(baseTask);
    (mockPrisma.$executeRaw as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .post("/api/tasks/task-1/reject")
      .set("x-user-id", LEAD.id);

    expect(res.status).toBe(409);
  });
});
