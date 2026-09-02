"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Market {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  results: { openPanna: string; jodi: string; closePanna: string }[];
}

export default function AdminDashboard() {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Market management states
  const [markets, setMarkets] = useState<Market[]>([]);
  const [name, setName] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [openPanna, setOpenPanna] = useState("");
  const [jodi, setJodi] = useState("");
  const [closePanna, setClosePanna] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/admin/verify");
      if (res.ok) {
        setIsAuthenticated(true);
        fetchMarkets();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsAuthenticated(true);
        fetchMarkets();
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Server error during login");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const fetchMarkets = async () => {
    try {
      const res = await fetch("/api/markets");
      const data = await res.json();
      if (Array.isArray(data)) setMarkets(data);
    } catch (err) {
      console.error("Error fetching markets:", err);
    }
  };

  const handleAddMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !openTime || !closeTime) {
      alert("Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, openTime, closeTime }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert("Server Error: " + (data.error || "Failed to add market"));
      } else {
        alert("Success! Added " + data.name);
        setName("");
        setOpenTime("");
        setCloseTime("");
        fetchMarkets();
      }
    } catch (err: any) {
      alert("Network Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarketId) {
      alert("Please select a market from the dropdown.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: selectedMarketId,
          openPanna,
          jodi,
          closePanna,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + (data.error || "Failed to update result"));
      } else {
        alert("Success! Live result updated.");
        setOpenPanna("");
        setJodi("");
        setClosePanna("");
        fetchMarkets();
      }
    } catch (err: any) {
      alert("Network Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Verifying admin session...
      </div>
    );
  }

  // Login Gate Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-amber-400 tracking-wider uppercase">
              DPBOSS PORTAL
            </h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
              Admin Access Login
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 p-3 rounded-lg text-slate-100 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 p-3 rounded-lg text-slate-100 focus:outline-none"
                required
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded font-semibold text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-lg transition-all uppercase tracking-wider text-sm shadow"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-amber-400">
            DPBOSS Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage live market draws and results</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-300 font-bold px-3 py-2 rounded-lg transition-all"
          >
            ↗ View Public Site
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-bold px-3.5 py-2 rounded-lg transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <form onSubmit={handleAddMarket} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold text-amber-300">1. Add New Market</h2>
          <input
            type="text"
            placeholder="Market Name (e.g. KALYAN NIGHT)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded text-amber-400 font-semibold focus:outline-none focus:border-amber-400"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Open Time (09:30 PM)"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-3 rounded text-slate-200 focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              placeholder="Close Time (11:30 PM)"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-3 rounded text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-3 rounded transition-all disabled:opacity-50"
          >
            {loading ? "Adding..." : "+ Add Market"}
          </button>
        </form>

        <form onSubmit={handlePostResult} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold text-amber-300">2. Post Live Result</h2>
          <select
            value={selectedMarketId}
            onChange={(e) => setSelectedMarketId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded text-amber-300 focus:outline-none focus:border-amber-400"
          >
            <option value="">Select Market</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Open Panna (123)"
              value={openPanna}
              onChange={(e) => setOpenPanna(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-3 rounded text-center text-amber-400 font-mono focus:outline-none"
            />
            <input
              type="text"
              placeholder="Jodi (67)"
              value={jodi}
              onChange={(e) => setJodi(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-3 rounded text-center text-amber-400 font-mono font-bold focus:outline-none"
            />
            <input
              type="text"
              placeholder="Close Panna (456)"
              value={closePanna}
              onChange={(e) => setClosePanna(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-3 rounded text-center text-amber-400 font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-3 rounded transition-all disabled:opacity-50"
          >
            {loading ? "Updating..." : "⚡ Update Live Result"}
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-slate-300">Active Markets</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => {
          const res = market.results?.[0];
          return (
            <div key={market.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <h3 className="font-extrabold text-amber-400 text-lg">{market.name}</h3>
              <p className="text-2xl font-mono font-bold text-slate-100 my-2">
                {res ? `${res.openPanna}-${res.jodi}-${res.closePanna}` : "***-**-***"}
              </p>
              <p className="text-xs text-slate-400">
                Open: {market.openTime} | Close: {market.closeTime}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
