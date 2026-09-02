"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Result {
  openPanna: string;
  jodi: string;
  closePanna: string;
}

interface Market {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  results: Result[];
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarkets = async () => {
    try {
      const res = await fetch("/api/markets", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setMarkets(data);
    } catch (err) {
      console.error("Failed to fetch live markets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const timer = setInterval(fetchMarkets, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <header className="bg-amber-500 text-slate-950 text-center py-5 px-4 shadow-lg border-b-4 border-amber-600">
        <h1 className="text-3xl md:text-5xl font-black tracking-wider uppercase">
          DPBOSS LIVE
        </h1>
        <p className="text-xs md:text-sm font-bold tracking-widest mt-1 uppercase">
          Fastest Live Satta Matka Results & Panel Charts
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-wide">
              Live Database Feed Active
            </span>
          </div>
          <button
            onClick={fetchMarkets}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold px-3 py-1.5 rounded transition-all"
          >
            ↻ Refresh
          </button>
        </div>

        <section className="space-y-4">
          <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-black text-center py-3 rounded-xl text-lg uppercase tracking-wide shadow">
            TODAY LIVE RESULTS
          </div>

          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              Loading live results...
            </div>
          ) : markets.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              No markets found. Add them in the <a href="/admin" className="text-amber-400 underline">Admin Dashboard</a>.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {markets.map((market) => {
                const latest = market.results?.[0];
                return (
                  <div
                    key={market.id}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 text-center shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg md:text-xl font-extrabold text-amber-400">
                          {market.name}
                        </h2>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          LIVE
                        </span>
                      </div>

                      <div className="text-3xl md:text-4xl font-mono font-black text-slate-100 my-4 tracking-widest bg-slate-950/60 py-3 rounded-lg border border-slate-800/80">
                        {latest ? (
                          <span>
                            <span className="text-amber-300">{latest.openPanna}</span>
                            <span className="text-slate-200"> - {latest.jodi} - </span>
                            <span className="text-amber-300">{latest.closePanna}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">*** - ** - ***</span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-400 flex justify-between px-2 pt-1 border-t border-slate-800/60 mb-4">
                        <span>Open: <strong className="text-slate-200">{market.openTime}</strong></span>
                        <span>Close: <strong className="text-slate-200">{market.closeTime}</strong></span>
                      </div>
                    </div>

                    <Link
                      href={`/chart?id=${market.id}`}
                      className="w-full bg-slate-950 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-bold text-xs py-2 rounded-lg transition-all uppercase tracking-wider block"
                    >
                      📊 View Panel Chart
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
