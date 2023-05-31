const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const main = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash("password", salt);

  const users = [
    {
      name: "Admin Webcare Indonesia",
      email: "admin@webcareidn.com",
      password: hashPassword,
      role: "admin",
    },
    {
      name: "User Webcare Indonesia",
      email: "user@webcareidn.com",
      password: hashPassword,
      role: "user",
    },
  ];

  users.forEach(async (user) => {
    user.role = user.role;
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      create: {
        ...user,
      },
      update: {
        ...user,
      },
    });
  });

  await prisma.attendanceSchedule.upsert({
    where: {
      id: 1,
    },
    create: {
      start_time: new Date("2021-01-01 08:00:00"),
      end_time: new Date("2021-01-01 17:00:00"),
    },
    update: {},
  });

  await prisma.attendanceLocation.upsert({
    where: {
      id: 1,
    },
    create: {
      latitude: -7.27781,
      longitude: 112.79552,
      radius: 10,
      is_active: false,
    },
    update: {},
  });

  console.log("Seeding completed.");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
