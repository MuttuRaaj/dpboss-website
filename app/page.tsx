"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Market {
  id: string | number;
  name: string;
  openTime: string;
  closeTime: string;
  results?: Array<{
    openPanna: string | null;
    jodi: string | null;
    closePanna: string | null;
  }>;
}

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchLiveResults = async () => {
    try {
      const res = await fetch("/api/markets");
      const data = await res.json();
      const list: Market[] = Array.isArray(data) ? data : data.markets || [];
      setMarkets(list);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching live results", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveResults();
    const interval = setInterval(fetchLiveResults, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0c1a30] text-amber-400 font-black flex items-center justify-center text-sm shadow-xs">
              DP
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                DPBOSS LIVE RESULTS
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Fastest Live Satta Matka Results & Panel Charts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed Active
            </span>
            <button
              onClick={fetchLiveResults}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <Link
              href="/admin"
              className="text-xs font-bold bg-[#0c1a30] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg shadow-xs transition inline-flex items-center gap-1"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-[#0c1a30] text-white rounded-xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wider text-amber-400">
              Today Live Market Results
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Updates in real-time upon declaration. Last sync: {lastRefreshed || "Just now"}
            </p>
          </div>
          <div className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-slate-200">
            Total Markets: {markets.length}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm font-medium">
            Fetching market draws...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {markets.map((m, index) => {
              const res = m.results && m.results.length > 0 ? m.results[0] : null;

              let openP = res?.openPanna || "***";
              let closeP = res?.closePanna || "***";
              let jodi = res?.jodi || "**";

              // If Jodi contains '*', Close has NOT been declared yet -> force '***'
              if (jodi.includes("*") || !res?.closePanna) {
                closeP = "***";
              }

              if (openP === "***" && closeP === "***") {
                jodi = "**";
              }

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 mr-1.5">#{index + 1}</span>
                      <span className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                        {m.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                      Live
                    </span>
                  </div>

                  <div className="p-5 text-center">
                    <div className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl shadow-xs">
                      <span className="text-xl sm:text-2xl font-mono font-bold text-slate-800 tracking-wider">
                        {openP}
                      </span>
                      <span className="text-slate-300 text-xl font-light">-</span>
                      <span className="text-2xl sm:text-3xl font-mono font-black bg-[#fefce8] border border-[#fef08a] text-[#854d0e] px-3 py-0.5 rounded-lg tracking-widest shadow-xs">
                        {jodi}
                      </span>
                      <span className="text-slate-300 text-xl font-light">-</span>
                      <span className="text-xl sm:text-2xl font-mono font-bold text-slate-800 tracking-wider">
                        {closeP}
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-center justify-center gap-3 text-xs text-slate-500 font-medium">
                      <span>Open: <strong className="text-slate-700">{m.openTime}</strong></span>
                      <span>•</span>
                      <span>Close: <strong className="text-slate-700">{m.closeTime}</strong></span>
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <Link
                      href={`/chart?market=${encodeURIComponent(m.name)}`}
                      className="w-full block text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-lg border border-slate-200 transition"
                    >
                      📊 View Panel Chart
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}