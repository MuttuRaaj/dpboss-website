const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const newMarkets = [
    {
      name: "SAGAR DAY",
      openTime: "01:30 PM",
      closeTime: "02:30 PM",
    },
    {
      name: "SAGAR NIGHT",
      openTime: "07:30 PM",
      closeTime: "08:30 PM",
    },
  ];

  for (const m of newMarkets) {
    const existing = await prisma.market.findFirst({
      where: { name: m.name },
    });

    if (!existing) {
      const created = await prisma.market.create({
        data: m,
      });
      console.log(`Created: ${created.name} (${created.openTime} - ${created.closeTime})`);
    } else {
      console.log(`Already exists: ${m.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });