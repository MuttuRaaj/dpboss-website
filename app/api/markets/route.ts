import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      include: {
        results: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Custom sorting: Sagar Day (#1), Sagar Night (#2), followed by remaining markets
    const sortedMarkets = [...markets].sort((a, b) => {
      const getPriority = (name: string) => {
        const upper = name.trim().toUpperCase();
        if (upper === "SAGAR DAY") return 1;
        if (upper === "SAGAR NIGHT") return 2;
        return 100;
      };

      const pA = getPriority(a.name);
      const pB = getPriority(b.name);

      if (pA !== pB) return pA - pB;
      return 0;
    });

    return NextResponse.json(sortedMarkets);
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