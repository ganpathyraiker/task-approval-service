import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: "Admin User", email: "admin@taskapp.com", role: Role.MANAGER },
    { name: "Lead User", email: "lead@taskapp.com", role: Role.TEAM_LEAD },
    { name: "Employee User", email: "employee@taskapp.com", role: Role.EMPLOYEE },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
