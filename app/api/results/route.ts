import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const savedResults = [];

    for (const item of items) {
      const { marketId, openPanna, jodi, closePanna, date, isHoliday } = item;

      if (!marketId) continue;

      // Skip completely empty market cards
      if (!openPanna && !jodi && !closePanna && !isHoliday) {
        continue;
      }

      // Normalize date string (YYYY-MM-DD) safely across timezones
      const dateStr = date
        ? String(date).split("T")[0]
        : new Date().toISOString().split("T")[0];

      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      const middayDate = new Date(`${dateStr}T12:00:00.000Z`);

      const targetMarketId = String(marketId);

      // Find if a record for this market and date already exists
      const existing = await prisma.result.findFirst({
        where: {
          marketId: targetMarketId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      const finalOpen = isHoliday ? "***" : (openPanna || "");
      const finalClose = isHoliday ? "***" : (closePanna || "");
      const finalJodi = isHoliday ? "**" : (jodi || "");

      if (existing) {
        const updated = await prisma.result.update({
          where: { id: existing.id },
          data: {
            openPanna: finalOpen,
            closePanna: finalClose,
            jodi: finalJodi,
            date: middayDate,
          },
        });
        savedResults.push(updated);
      } else {
        const created = await prisma.result.create({
          data: {
            marketId: targetMarketId,
            openPanna: finalOpen,
            closePanna: finalClose,
            jodi: finalJodi,
            date: middayDate,
          },
        });
        savedResults.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      count: savedResults.length,
      results: savedResults,
    });
  } catch (error: any) {
    console.error("Error saving results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save results" },
      { status: 500 }
    );
  }
}