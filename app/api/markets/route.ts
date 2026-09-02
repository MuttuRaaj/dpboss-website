import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      include: {
        results: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(markets);
  } catch (error: any) {
    console.error("GET /api/markets error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to fetch markets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.openTime || !body.closeTime) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    const market = await prisma.market.create({
      data: {
        name: body.name.toUpperCase(),
        openTime: body.openTime,
        closeTime: body.closeTime,
      },
    });
    return NextResponse.json(market);
  } catch (error: any) {
    console.error("POST /api/markets error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to create market" }, { status: 500 });
  }
}
