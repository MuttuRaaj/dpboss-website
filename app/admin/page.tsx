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

interface ResultEntry {
  openPanna: string;
  openD: string;
  closePanna: string;
  closeD: string;
  openError?: boolean;
  closeError?: boolean;
  isHoliday: boolean;
}

function isValidMatkaPanna(panna: string): boolean {
  const clean = panna.replace(/\D/g, "");
  if (clean.length !== 3) return false;
  const getVal = (char: string) => (char === "0" ? 10 : parseInt(char, 10));
  const [d1, d2, d3] = clean.split("").map(getVal);
  return d1 <= d2 && d2 <= d3;
}

function calculateSumDigit(panna: string): string {
  const clean = panna.replace(/\D/g, "");
  if (clean.length !== 3) return "";
  const sum = clean
    .split("")
    .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  return (sum % 10).toString();
}

export default function AdminPage() {
  // Security & Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Dashboard Data States
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [entries, setEntries] = useState<Record<string | number, ResultEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check persistent session on load
  useEffect(() => {
    const authState = sessionStorage.getItem("admin_authenticated");
    if (authState === "true") {
      setIsAuthenticated(true);
      loadDashboardData();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/markets");
      const data = await res.json();
      const marketList: Market[] = Array.isArray(data) ? data : data.markets || [];
      setMarkets(marketList);

      const initialEntries: Record<string | number, ResultEntry> = {};
      marketList.forEach((m) => {
        const latest = m.results && m.results.length > 0 ? m.results[0] : null;
        const openP = latest?.openPanna && latest.openPanna !== "***" ? latest.openPanna : "";
        const closeP =
          latest?.closePanna && latest.closePanna !== "***" && (!latest.jodi || !latest.jodi.includes("*"))
            ? latest.closePanna
            : "";
        const isHol = latest?.openPanna === "***" && latest?.closePanna === "***";

        initialEntries[m.id] = {
          openPanna: openP,
          openD: openP ? calculateSumDigit(openP) : "",
          closePanna: closeP,
          closeD: closeP ? calculateSumDigit(closeP) : "",
          openError: false,
          closeError: false,
          isHoliday: isHol,
        };
      });
      setEntries(initialEntries);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  // PIN Form Submission
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setVerifyingPin(true);
    setPinError("");

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Incorrect PIN");
      }

      sessionStorage.setItem("admin_authenticated", "true");
      setIsAuthenticated(true);
      loadDashboardData();
    } catch (err: any) {
      setPinError(err.message || "Failed to verify PIN");
    } finally {
      setVerifyingPin(false);
    }
  };

  // Logout / Lock Action
  const handleLock = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
    setPinInput("");
    setPinError("");
  };

  const handlePannaChange = (
    marketId: string | number,
    field: "openPanna" | "closePanna",
    val: string
  ) => {
    const cleanVal = val.replace(/\D/g, "").slice(0, 3);
    const isFieldOpen = field === "openPanna";

    const isInvalid = cleanVal.length === 3 && !isValidMatkaPanna(cleanVal);
    const sumDigit = cleanVal.length === 3 && !isInvalid ? calculateSumDigit(cleanVal) : "";

    setEntries((prev) => {
      const current = prev[marketId] || {
        openPanna: "",
        openD: "",
        closePanna: "",
        closeD: "",
        openError: false,
        closeError: false,
        isHoliday: false,
      };

      if (isFieldOpen) {
        return {
          ...prev,
          [marketId]: {
            ...current,
            openPanna: cleanVal,
            openD: sumDigit,
            openError: isInvalid,
          },
        };
      } else {
        return {
          ...prev,
          [marketId]: {
            ...current,
            closePanna: cleanVal,
            closeD: sumDigit,
            closeError: isInvalid,
          },
        };
      }
    });
  };

  const handleHolidayToggle = (marketId: string | number) => {
    setEntries((prev) => ({
      ...prev,
      [marketId]: {
        ...prev[marketId],
        isHoliday: !prev[marketId]?.isHoliday,
      },
    }));
  };

  const handleSaveAll = async () => {
    const hasErrors = Object.values(entries).some((e) => e.openError || e.closeError);
    if (hasErrors) {
      setErrorMessage("Please fix descending/invalid Panna numbers before saving.");
      return;
    }

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = Object.entries(entries).map(([marketId, data]) => {
        let jodi = null;
        if (data.isHoliday) {
          jodi = "**";
        } else if (data.openD && data.closeD) {
          jodi = `${data.openD}${data.closeD}`;
        } else if (data.openD) {
          jodi = `${data.openD}*`;
        }

        return {
          marketId: isNaN(Number(marketId)) ? marketId : Number(marketId),
          date: selectedDate,
          openPanna: data.isHoliday ? "***" : data.openPanna || "",
          closePanna: data.isHoliday ? "***" : data.closePanna || "",
          jodi: jodi || "",
          isHoliday: data.isHoliday,
        };
      });

      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to save results");
      }

      setSuccessMessage("All market results saved successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update results");
    } finally {
      setSaving(false);
    }
  };

  // 1. Session verification placeholder
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center text-slate-500 text-sm">
        Checking session...
      </div>
    );
  }

  // 2. PIN Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-7 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0c1a30] text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Admin Passcode</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">Enter master PIN to manage market results</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-bold"
            />

            {pinError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 py-2 rounded-lg">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              disabled={verifyingPin || !pinInput}
              className="w-full bg-[#0c1a30] hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition text-sm cursor-pointer shadow-xs disabled:opacity-50"
            >
              {verifyingPin ? "Verifying..." : "Unlock Dashboard"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              ← Return to Live Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 pb-24">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              title="View Public Website"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Market Results Admin</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Declare daily results & auto-calculate sums</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200 transition inline-flex items-center gap-1.5"
            >
              <span>Live Site</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              onClick={handleLock}
              className="text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-md border border-slate-200 hover:border-rose-200 transition inline-flex items-center gap-1.5 cursor-pointer"
              title="Lock Admin Dashboard"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Date:</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-hidden cursor-pointer text-sm"
              />
            </div>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Total Markets: <span className="font-bold text-slate-800">{markets.length}</span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-3 shadow-xs">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium shadow-xs">
            {errorMessage}
          </div>
        )}

        {/* Markets Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading markets...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {markets.map((market, index) => {
              const data = entries[market.id] || {
                openPanna: "",
                openD: "",
                closePanna: "",
                closeD: "",
                openError: false,
                closeError: false,
                isHoliday: false,
              };

              return (
                <div
                  key={market.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 border-b border-slate-200 flex items-center justify-between">
                    <span>#{index + 1}</span>
                    <span className="text-[11px] font-semibold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {market.openTime} - {market.closeTime}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-wide uppercase">
                      {market.name}
                    </h2>

                    {/* Open Panna */}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="w-14 text-sm font-semibold text-slate-600">Open:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Panna"
                          maxLength={3}
                          disabled={data.isHoliday}
                          value={data.openPanna}
                          onChange={(e) =>
                            handlePannaChange(market.id, "openPanna", e.target.value)
                          }
                          className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm font-bold text-center tracking-widest outline-hidden transition ${
                            data.openError
                              ? "border-rose-500 text-rose-600 bg-rose-50/50"
                              : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          } disabled:bg-slate-100 disabled:text-slate-400`}
                        />
                        <div
                          className={`w-12 h-9.5 rounded-lg flex items-center justify-center font-extrabold text-sm shadow-xs select-none ${
                            data.openError
                              ? "bg-rose-100 border border-rose-300 text-rose-700"
                              : "bg-[#fefce8] border border-[#fef08a] text-[#854d0e]"
                          }`}
                        >
                          {data.openError ? "!" : data.openD || "D"}
                        </div>
                      </div>
                      {data.openError && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 ml-17">
                          Digits must be ascending (e.g. 123, 120)
                        </p>
                      )}
                    </div>

                    {/* Close Panna */}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="w-14 text-sm font-semibold text-slate-600">Close:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Panna"
                          maxLength={3}
                          disabled={data.isHoliday}
                          value={data.closePanna}
                          onChange={(e) =>
                            handlePannaChange(market.id, "closePanna", e.target.value)
                          }
                          className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm font-bold text-center tracking-widest outline-hidden transition ${
                            data.closeError
                              ? "border-rose-500 text-rose-600 bg-rose-50/50"
                              : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          } disabled:bg-slate-100 disabled:text-slate-400`}
                        />
                        <div
                          className={`w-12 h-9.5 rounded-lg flex items-center justify-center font-extrabold text-sm shadow-xs select-none ${
                            data.closeError
                              ? "bg-rose-100 border border-rose-300 text-rose-700"
                              : "bg-[#fefce8] border border-[#fef08a] text-[#854d0e]"
                          }`}
                        >
                          {data.closeError ? "!" : data.closeD || "D"}
                        </div>
                      </div>
                      {data.closeError && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 ml-17">
                          Digits must be ascending (e.g. 123, 120)
                        </p>
                      )}
                    </div>

                    {/* Holiday */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={data.isHoliday}
                          onChange={() => handleHolidayToggle(market.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        Market Holiday
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Save Button */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3 px-4 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 hidden sm:block">
            Ascending order enforced. Leaving Close blank updates Open draw without showing closing numbers.
          </p>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full sm:w-auto sm:min-w-[240px] ml-auto bg-[#0c1a30] text-white py-2.5 px-6 rounded-lg font-bold text-sm tracking-wide shadow-md hover:bg-slate-800 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Saving Results...
              </>
            ) : (
              "Save All Results"
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}