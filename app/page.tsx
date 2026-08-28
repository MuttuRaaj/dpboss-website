"use client";

import { useState } from "react";

interface Market {
  id: string;
  name: string;
  result: string;
  openTime: string;
  closeTime: string;
  isLive: boolean;
}

const INITIAL_MARKETS: Market[] = [
  {
    id: "1",
    name: "SRIDEVI",
    result: "130 - 40 - 280",
    openTime: "11:35 AM",
    closeTime: "12:35 PM",
    isLive: false,
  },
  {
    id: "2",
    name: "TIME BAZAR",
    result: "246 - 28 - 189",
    openTime: "01:10 PM",
    closeTime: "02:10 PM",
    isLive: false,
  },
  {
    id: "3",
    name: "KALYAN MATKA",
    result: "256 - 38 - 189",
    openTime: "04:10 PM",
    closeTime: "06:10 PM",
    isLive: true,
  },
  {
    id: "4",
    name: "MILAN DAY",
    result: "110 - 29 - 450",
    openTime: "03:15 PM",
    closeTime: "05:15 PM",
    isLive: true,
  },
  {
    id: "5",
    name: "RAJDHANI NIGHT",
    result: "*** - ** - ***",
    openTime: "09:25 PM",
    closeTime: "11:35 PM",
    isLive: false,
  },
  {
    id: "6",
    name: "MAIN BAZAR",
    result: "*** - ** - ***",
    openTime: "09:40 PM",
    closeTime: "12:05 AM",
    isLive: false,
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMarkets = INITIAL_MARKETS.filter((market) =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header Section */}
      <header className="max-w-4xl mx-auto text-center py-6 border-b border-slate-800">
        <h1 className="text-3xl md:text-5xl font-extrabold text-amber-400 tracking-wider">
          DPBOSS MARKET RESULTS
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2">
          Fastest Live Satta Matka Results & Panel Charts
        </p>

        {/* Search Bar */}
        <div className="mt-6 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search market name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>
      </header>

      {/* Live Market Grid */}
      <section className="max-w-4xl mx-auto mt-8 grid gap-4 md:grid-cols-2">
        {filteredMarkets.map((market) => (
          <div
            key={market.id}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-lg transition"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-amber-300">{market.name}</h2>
              {market.isLive ? (
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 animate-pulse">
                  LIVE
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  CLOSED
                </span>
              )}
            </div>

            <p className="text-3xl font-black text-center my-4 tracking-widest text-white">
              {market.result}
            </p>

            <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Open: {market.openTime}</span>
              <span>Close: {market.closeTime}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}