import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Define users, credentials, and their allowed market IDs or names
// Use "ALL" for super admin (Sagar)
interface AdminAccount {
  user: string;
  pass: string;
  name: string;
  role: "superadmin" | "market_admin";
  allowedMarkets: string[]; // e.g. ["ALL"] or ["KALYAN MATKA", "TIME BAZAR"]
}

const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    user: "sagar",
    pass: "sagar123", // change to desired secure password
    name: "Sagar (Super Admin)",
    role: "superadmin",
    allowedMarkets: ["ALL"],
  },
  {
    user: "kalyan",
    pass: "kalyan123", // client password for Kalyan Matka
    name: "Kalyan Operator",
    role: "market_admin",
    allowedMarkets: ["KALYAN MATKA"],
  },
  {
    user: "timebazar",
    pass: "time123", // client password for Time Bazar
    name: "Time Bazar Operator",
    role: "market_admin",
    allowedMarkets: ["TIME BAZAR"],
  },
  {
    user: "milanday",
    pass: "milan123", // client password for Milan Day
    name: "Milan Day Operator",
    role: "market_admin",
    allowedMarkets: ["MILAN DAY"],
  },
  {
    user: "rajdhani",
    pass: "rajdhani123", // client password for Rajdhani Night
    name: "Rajdhani Operator",
    role: "market_admin",
    allowedMarkets: ["RAJDHANI NIGHT"],
  },
];

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Check against defined accounts (or fallback to env admin as superadmin)
    const envUser = process.env.ADMIN_USER || "admin";
    const envPass = process.env.ADMIN_PASS || "admin123";

    let matchedAccount = ADMIN_ACCOUNTS.find(
      (acc) => acc.user.toLowerCase() === username?.trim().toLowerCase() && acc.pass === password
    );

    if (!matchedAccount && username === envUser && password === envPass) {
      matchedAccount = {
        user: envUser,
        pass: envPass,
        name: "Super Admin",
        role: "superadmin",
        allowedMarkets: ["ALL"],
      };
    }

    if (matchedAccount) {
      const sessionData = {
        user: matchedAccount.user,
        name: matchedAccount.name,
        role: matchedAccount.role,
        allowedMarkets: matchedAccount.allowedMarkets,
      };

      const cookieStore = await cookies();
      cookieStore.set("admin_session", JSON.stringify(sessionData), {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return NextResponse.json({
        success: true,
        user: sessionData,
      });
    }

    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}