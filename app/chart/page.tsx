"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Result {
  id: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
  date?: string;
  createdAt: string;
}

interface Market {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  results?: Result[];
}

interface DayCell {
  openPanna: string;
  jodi: string;
  closePanna: string;
}

interface WeekRow {
  weekLabel: string;
  mondayTimestamp: number;
  days: (DayCell | null)[]; // 0: Mon, 1: Tue, 2: Wed, 3: Thu, 4: Fri, 5: Sat, 6: Sun
}

// Matka Red Jodi Rule: Full Red (same digit e.g. 11, 22) or Half Red (cut pair e.g. 16, 27, 38, 49, 05)
function isRedJodi(jodi: string): boolean {
  if (!jodi || jodi.length !== 2) return false;
  const d1 = parseInt(jodi[0], 10);
  const d2 = parseInt(jodi[1], 10);
  if (isNaN(d1) || isNaN(d2)) return false;
  return d1 === d2 || Math.abs(d1 - d2) === 5;
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function ChartContent() {
  const searchParams = useSearchParams();
  const marketId = searchParams.get("id") || searchParams.get("marketId");

  const [market, setMarket] = useState<Market | null>(null);
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [viewMode, setViewMode] = useState<"panel" | "jodi">("panel");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/markets");
        if (!res.ok) throw new Error("Failed to fetch markets");
        const markets: Market[] = await res.json();

        const selectedMarket = marketId
          ? markets.find((m) => m.id === marketId) || markets[0]
          : markets[0];

        if (!selectedMarket) {
          setLoading(false);
          return;
        }

        setMarket(selectedMarket);

        // Group results into standard DPBoss Monday-Sunday weekly rows
        const rawResults = selectedMarket.results || [];
        const weekMap: { [key: string]: WeekRow } = {};

        rawResults.forEach((item) => {
          const itemDate = new Date(item.date || item.createdAt);
          if (isNaN(itemDate.getTime())) return;

          // Standard Matka Monday-to-Sunday calculation
          const day = itemDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
          const dayIndex = (day + 6) % 7; // Mon = 0, Tue = 1, ..., Sun = 6

          const monday = new Date(itemDate);
          monday.setDate(itemDate.getDate() - dayIndex);
          monday.setHours(0, 0, 0, 0);

          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);

          const weekKey = monday.toISOString().split("T")[0];

          if (!weekMap[weekKey]) {
            weekMap[weekKey] = {
              weekLabel: `${formatDate(monday)} to ${formatDate(sunday)}`,
              mondayTimestamp: monday.getTime(),
              days: [null, null, null, null, null, null, null],
            };
          }

          weekMap[weekKey].days[dayIndex] = {
            openPanna: item.openPanna || "***",
            jodi: item.jodi || "**",
            closePanna: item.closePanna || "***",
          };
        });

        // Sort weeks with newest week on top
        const sortedWeeks = Object.values(weekMap).sort(
          (a, b) => b.mondayTimestamp - a.mondayTimestamp
        );

        setWeeks(sortedWeeks);
      } catch (err) {
        console.error("Error loading panel chart:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [marketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-amber-400 flex items-center justify-center font-bold text-lg">
        Loading Panel Chart Matrix...
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-bold mb-4">No Market Chart Found</p>
        <Link
          href="/"
          className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-lg font-bold"
        >
          ← Return to Live Results
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white pb-16">
      {/* Top Header */}
      <div className="bg-[#0b1329] border-b border-amber-500/30 px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            ← Back to Live Results
          </Link>
          <span className="text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
            ● Live Chart Feed
          </span>
        </div>
      </div>

      {/* Market Title Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 text-center">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-amber-400 uppercase tracking-wide">
          {market.name} {viewMode === "panel" ? "PANEL" : "JODI"} CHART
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 font-mono">
          Draw Timings:{" "}
          <span className="text-white font-bold">{market.openTime}</span> -{" "}
          <span className="text-white font-bold">{market.closeTime}</span>
        </p>

        {/* View Mode Switcher */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setViewMode("panel")}
            className={`px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
              viewMode === "panel"
                ? "bg-amber-500 text-black border-2 border-amber-400 scale-105"
                : "bg-[#101b3b] text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-800"
            }`}
          >
            📊 Panel Chart
          </button>
          <button
            onClick={() => setViewMode("jodi")}
            className={`px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
              viewMode === "jodi"
                ? "bg-amber-500 text-black border-2 border-amber-400 scale-105"
                : "bg-[#101b3b] text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-800"
            }`}
          >
            🔢 Jodi Chart
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Normal Jodi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Red / Cut Pair
          </span>
        </div>
      </div>

      {/* DPBoss Weekly Panel Table */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="bg-[#0b1329] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#101b3b] border-b border-slate-700 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-3 border-r border-slate-700 w-36">
                    Date Range
                  </th>
                  <th className="py-3.5 px-2 border-r border-slate-700">Mon</th>
                  <th className="py-3.5 px-2 border-r border-slate-700">Tue</th>
                  <th className="py-3.5 px-2 border-r border-slate-700">Wed</th>
                  <th className="py-3.5 px-2 border-r border-slate-700">Thu</th>
                  <th className="py-3.5 px-2 border-r border-slate-700">Fri</th>
                  <th className="py-3.5 px-2 border-r border-slate-700">Sat</th>
                  <th className="py-3.5 px-2">Sun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
                {weeks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-slate-400 font-medium text-center"
                    >
                      No historical records available for this market.
                    </td>
                  </tr>
                ) : (
                  weeks.map((row) => (
                    <tr
                      key={row.weekLabel}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Week Date Column */}
                      <td className="py-3 px-2 border-r border-slate-800 font-mono text-[11px] sm:text-xs text-slate-300 font-medium whitespace-nowrap bg-[#080e1e]/60">
                        {row.weekLabel}
                      </td>

                      {/* Mon to Sun Columns */}
                      {row.days.map((cell, idx) => (
                        <td
                          key={idx}
                          className={`py-2 px-1 border-r border-slate-800 last:border-r-0 ${
                            idx >= 5 ? "bg-slate-900/40" : ""
                          }`}
                        >
                          {cell ? (
                            viewMode === "panel" ? (
                              <div className="flex flex-col items-center justify-center font-mono leading-tight py-1">
                                <span className="text-[11px] sm:text-xs text-slate-400 tracking-wider">
                                  {cell.openPanna}
                                </span>
                                <span
                                  className={`text-base sm:text-lg font-black my-0.5 ${
                                    isRedJodi(cell.jodi)
                                      ? "text-red-500 font-extrabold"
                                      : "text-amber-400"
                                  }`}
                                >
                                  {cell.jodi}
                                </span>
                                <span className="text-[11px] sm:text-xs text-slate-400 tracking-wider">
                                  {cell.closePanna}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center font-mono py-3">
                                <span
                                  className={`text-xl sm:text-2xl font-black ${
                                    isRedJodi(cell.jodi)
                                      ? "text-red-500 font-extrabold"
                                      : "text-amber-400"
                                  }`}
                                >
                                  {cell.jodi}
                                </span>
                              </div>
                            )
                          ) : (
                            viewMode === "panel" ? (
                              <div className="flex flex-col items-center justify-center font-mono text-slate-600 text-xs py-2">
                                <span>***</span>
                                <span className="font-bold my-0.5">**</span>
                                <span>***</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center font-mono text-slate-600 text-base py-3">
                                **
                              </div>
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b14] text-amber-400 flex items-center justify-center font-bold">
          Loading...
        </div>
      }
    >
      <ChartContent />
    </Suspense>
  );
}