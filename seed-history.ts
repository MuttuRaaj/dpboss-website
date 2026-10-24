import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Calculate Jodi from panna
function calculateSingle(panna: string): string {
  const sum = panna.split("").reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  return (sum % 10).toString();
}

// Authentic panna combinations
const pannas = [
  "123", "138", "247", "358", "149", "259", "368", "479",
  "124", "139", "248", "359", "150", "260", "370", "480",
  "125", "140", "249", "360", "160", "270", "380", "490",
  "134", "158", "257", "347", "179", "289", "390", "579"
];

function getRandomPanna(): string {
  return pannas[Math.floor(Math.random() * pannas.length)];
}

async function main() {
  console.log("Fetching markets from database...");
  const markets = await prisma.market.findMany();

  if (markets.length === 0) {
    console.log("No markets found! Please ensure markets exist in DB.");
    return;
  }

  const daysToGenerate = 60; // Populates past 2 months
  console.log(`Generating ${daysToGenerate} days of history for ${markets.length} markets...`);

  for (const market of markets) {
    console.log(`Populating history for: ${market.name}`);

    for (let i = daysToGenerate; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(12, 0, 0, 0);

      // Skip Sundays for markets closed on Sunday
      if (targetDate.getDay() === 0 && market.name.toLowerCase().includes("kalyan")) {
        continue;
      }

      const openPanna = getRandomPanna();
      const closePanna = getRandomPanna();
      const openSingle = calculateSingle(openPanna);
      const closeSingle = calculateSingle(closePanna);
      const jodi = `${openSingle}${closeSingle}`;

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await prisma.result.findFirst({
        where: {
          marketId: market.id,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      if (!existing) {
        await prisma.result.create({
          data: {
            marketId: market.id,
            openPanna,
            jodi,
            closePanna,
            date: targetDate
          }
        });
      }
    }
  }

  console.log("History population complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });