import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const savedResults = [];

    for (const item of items) {
      const { marketId, openPanna, jodi, closePanna, date, isHoliday } = item;

      // Skip completely empty market cards
      if (!openPanna && !jodi && !closePanna && !isHoliday) {
        continue;
      }

      const parsedDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const numericId = !isNaN(Number(marketId)) ? Number(marketId) : null;
      const targetId = numericId !== null ? numericId : marketId;

      // Find if today's record already exists
      let existing = null;
      try {
        existing = await prisma.result.findFirst({
          where: {
            marketId: targetId as any,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });
      } catch {
        existing = await prisma.result.findFirst({
          where: {
            marketId: String(marketId) as any,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });
      }

      // Convert empty inputs to "" instead of null so MySQL doesn't reject them
      const finalOpen = isHoliday ? "***" : (openPanna || "");
      const finalClose = isHoliday ? "***" : (closePanna || "");
      const finalJodi = isHoliday ? "**" : (jodi || "");

      if (existing) {
        // Update existing record
        const updated = await prisma.result.update({
          where: { id: existing.id },
          data: {
            openPanna: finalOpen,
            closePanna: finalClose,
            jodi: finalJodi,
          },
        });
        savedResults.push(updated);
      } else {
        // Create new record
        try {
          const created = await prisma.result.create({
            data: {
              marketId: targetId as any,
              openPanna: finalOpen,
              closePanna: finalClose,
              jodi: finalJodi,
              date: parsedDate,
            },
          });
          savedResults.push(created);
        } catch {
          const created = await prisma.result.create({
            data: {
              market: {
                connect: { id: targetId as any },
              },
              openPanna: finalOpen,
              closePanna: finalClose,
              jodi: finalJodi,
              date: parsedDate,
            },
          });
          savedResults.push(created);
        }
      }
    }

    return NextResponse.json({ success: true, count: savedResults.length });
  } catch (error: any) {
    console.error("Error saving results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save results" },
      { status: 500 }
    );
  }
}