import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { marketId, openPanna, jodi, closePanna } = await request.json();
    const result = await prisma.result.create({
      data: {
        marketId,
        openPanna: openPanna || "***",
        jodi: jodi || "**",
        closePanna: closePanna || "***",
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to post result" }, { status: 500 });
  }
}
