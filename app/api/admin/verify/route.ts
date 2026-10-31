import { NextResponse } from "next/server";

interface AdminRole {
  name: string;
  role: "superadmin" | "market_admin";
  allowedMarkets: string[]; // ["ALL"] or market names in UPPERCASE
}

// PIN mapping for clients and operators
const PIN_MAP: Record<string, AdminRole> = {
  // Super Admin (Sagar) - Full Access
  "9999": {
    name: "Sagar (Super Admin)",
    role: "superadmin",
    allowedMarkets: ["ALL"],
  },
  // Kalyan Matka Operator
  "1111": {
    name: "Kalyan Matka Admin",
    role: "market_admin",
    allowedMarkets: ["KALYAN MATKA"],
  },
  // Time Bazar Operator
  "2222": {
    name: "Time Bazar Admin",
    role: "market_admin",
    allowedMarkets: ["TIME BAZAR"],
  },
  // Milan Day Operator
  "3333": {
    name: "Milan Day Admin",
    role: "market_admin",
    allowedMarkets: ["MILAN DAY"],
  },
  // Rajdhani Night Operator
  "4444": {
    name: "Rajdhani Night Admin",
    role: "market_admin",
    allowedMarkets: ["RAJDHANI NIGHT"],
  },
};

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const fallbackPin = process.env.ADMIN_PIN || "1234";

    // 1. Check known PINs
    if (pin && PIN_MAP[pin]) {
      return NextResponse.json({
        success: true,
        user: PIN_MAP[pin],
      });
    }

    // 2. Check fallback env PIN (grants superadmin access)
    if (pin === fallbackPin) {
      return NextResponse.json({
        success: true,
        user: {
          name: "Super Admin",
          role: "superadmin",
          allowedMarkets: ["ALL"],
        },
      });
    }

    return NextResponse.json(
      { error: "Incorrect PIN. Please try again." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Verification failed. Check server logs." },
      { status: 500 }
    );
  }
}