import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const correctPin = process.env.ADMIN_PIN || "1234";

    if (pin === correctPin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Incorrect PIN. Please try again." },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Verification failed. Check server logs." },
      { status: 500 }
    );
  }
}