import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");

    const whereClause: any = {};
    if (marketId && marketId !== "ALL") {
      whereClause.marketId = marketId;
    }

    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        market: {
          select: {
            id: true,
            name: true,
            openTime: true,
            closeTime: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 40,
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("GET /api/admin/history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}