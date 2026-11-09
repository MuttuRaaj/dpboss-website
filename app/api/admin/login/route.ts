import { NextResponse } from "next/server";
import { cookies } from "next/headers";

interface ClientAccount {
  user: string;
  pass: string;
  name: string;
  role: "superadmin" | "market_admin";
  allowedMarkets: string[]; // Market names or "ALL"
}

// Credentials registry maintained by the developer
const CLIENT_ACCOUNTS: ClientAccount[] = [
  // Super Admin (Sagar) - Full visibility & access to all markets
  {
    user: "sagar",
    pass: "sagar@9999",
    name: "Sagar (Platform Owner)",
    role: "superadmin",
    allowedMarkets: ["ALL"],
  },
  // Kalyan Client - Sees only Kalyan Day / Night
  {
    user: "kalyan_admin",
    pass: "kalyan@123",
    name: "Kalyan Matka Admin",
    role: "market_admin",
    allowedMarkets: ["KALYAN MATKA"],
  },
  // Time Bazar Client
  {
    user: "time_admin",
    pass: "time@123",
    name: "Time Bazar Admin",
    role: "market_admin",
    allowedMarkets: ["TIME BAZAR"],
  },
  // Milan Day Client
  {
    user: "milan_admin",
    pass: "milan@123",
    name: "Milan Day Admin",
    role: "market_admin",
    allowedMarkets: ["MILAN DAY"],
  },
  // Rajdhani Night Client
  {
    user: "rajdhani_admin",
    pass: "rajdhani@123",
    name: "Rajdhani Night Admin",
    role: "market_admin",
    allowedMarkets: ["RAJDHANI NIGHT"],
  },
];

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const cleanUser = username?.trim().toLowerCase();
    const cleanPass = password?.trim();

    // Check predefined client accounts
    let account = CLIENT_ACCOUNTS.find(
      (acc) => acc.user.toLowerCase() === cleanUser && acc.pass === cleanPass
    );

    // Fallback to env superadmin if matched
    const envUser = (process.env.ADMIN_USER || "admin").toLowerCase();
    const envPass = process.env.ADMIN_PASS || "admin123";

    if (!account && cleanUser === envUser && cleanPass === envPass) {
      account = {
        user: envUser,
        pass: envPass,
        name: "Super Admin",
        role: "superadmin",
        allowedMarkets: ["ALL"],
      };
    }

    if (!account) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      user: account.user,
      name: account.name,
      role: account.role,
      allowedMarkets: account.allowedMarkets,
    };

    const cookieStore = await cookies();
    cookieStore.set("admin_session", JSON.stringify(sessionPayload), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication failed. Server error." },
      { status: 500 }
    );
  }
}