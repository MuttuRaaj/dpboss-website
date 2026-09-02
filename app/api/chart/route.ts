import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");

    if (!marketId) {
      return NextResponse.json({ error: "Market ID required" }, { status: 400 });
    }

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        results: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    return NextResponse.json(market);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch chart" }, { status: 500 });
  }
}
