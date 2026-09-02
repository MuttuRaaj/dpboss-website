"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Result {
  id: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
  createdAt: string;
}

interface Market {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  results?: Result[];
}

function ChartContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string>(initialId);
  const [marketData, setMarketData] = useState<Market | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/markets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMarkets(data);
          if (!initialId && data.length > 0) {
            setSelectedMarketId(data[0].id);
          }
        }
      });
  }, [initialId]);

  useEffect(() => {
    if (!selectedMarketId) return;
    setLoading(true);
    fetch(`/api/chart?marketId=${selectedMarketId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setMarketData(data);
      })
      .finally(() => setLoading(false));
  }, [selectedMarketId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Link
          href="/"
          className="text-xs bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-300 font-bold px-4 py-2 rounded-lg transition-all"
        >
          ← Back to Live Results
        </Link>
        <div className="w-full sm:w-auto">
          <select
            value={selectedMarketId}
            onChange={(e) => setSelectedMarketId(e.target.value)}
            className="w-full sm:w-64 bg-slate-900 border border-amber-500/40 text-amber-400 font-bold p-2.5 rounded-lg focus:outline-none"
          >
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {marketData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-amber-400 tracking-wider uppercase">
            {marketData.name} PANEL CHART
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Open: <span className="text-slate-200">{marketData.openTime}</span> | Close:{" "}
            <span className="text-slate-200">{marketData.closeTime}</span>
          </p>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          Loading chart history...
        </div>
      ) : !marketData || !marketData.results || marketData.results.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No historical records found for this market.
        </div>
      ) : (
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-amber-500 text-slate-950 text-xs md:text-sm font-black uppercase tracking-wider">
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Day</th>
                <th className="py-3.5 px-3">Open Panna</th>
                <th className="py-3.5 px-3 text-red-950">Jodi</th>
                <th className="py-3.5 px-3">Close Panna</th>
                <th className="py-3.5 px-3">Full Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-sm md:text-base">
              {marketData.results.map((item) => {
                const dateObj = new Date(item.createdAt);
                const dateStr = dateObj.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                const dayStr = dateObj.toLocaleDateString("en-IN", { weekday: "short" });

                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 text-slate-400 text-xs font-sans">{dateStr}</td>
                    <td className="py-3 px-3 text-slate-300 font-sans font-bold text-xs uppercase">{dayStr}</td>
                    <td className="py-3 px-3 text-amber-300 font-bold">{item.openPanna}</td>
                    <td className="py-3 px-3 text-rose-400 font-black text-lg bg-rose-500/10">
                      {item.jodi}
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-bold">{item.closePanna}</td>
                    <td className="py-3 px-3 text-slate-100 font-bold text-xs md:text-sm">
                      {item.openPanna}-{item.jodi}-{item.closePanna}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ChartPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <header className="bg-amber-500 text-slate-950 text-center py-4 px-4 shadow-lg border-b-4 border-amber-600">
        <h1 className="text-2xl md:text-4xl font-black tracking-wider uppercase">
          DPBOSS PANEL CHARTS
        </h1>
      </header>
      <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading chart...</div>}>
        <ChartContent />
      </Suspense>
    </main>
  );
}
