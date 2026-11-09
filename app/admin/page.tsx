"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Market {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  results?: Array<{
    id?: string;
    openPanna: string | null;
    jodi: string | null;
    closePanna: string | null;
    date?: string;
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

interface CurrentUser {
  user: string;
  name: string;
  role: "superadmin" | "market_admin";
  allowedMarkets: string[];
}

interface HistoryItem {
  id: string;
  marketId: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  market: {
    id: string;
    name: string;
    openTime: string;
    closeTime: string;
  };
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [entries, setEntries] = useState<Record<string, ResultEntry>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const authState = sessionStorage.getItem("admin_authenticated");
    const storedUser = sessionStorage.getItem("admin_user");
    if (authState === "true" && storedUser) {
      try {
        const userObj: CurrentUser = JSON.parse(storedUser);
        setCurrentUser(userObj);
        setIsAuthenticated(true);
        loadDashboardData(userObj);
      } catch {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const loadDashboardData = async (user: CurrentUser) => {
    try {
      setLoading(true);
      const res = await fetch("/api/markets");
      const data = await res.json();
      const allMarkets: Market[] = Array.isArray(data) ? data : data.markets || [];

      // Requirement 1: Only show the client's assigned markets (Super Admin sees all)
      const visibleMarkets =
        user.role === "superadmin" || user.allowedMarkets.includes("ALL")
          ? allMarkets
          : allMarkets.filter((m) =>
              user.allowedMarkets.some(
                (allowed) => m.name.trim().toUpperCase() === allowed.trim().toUpperCase()
              )
            );

      setMarkets(visibleMarkets);

      const initialEntries: Record<string, ResultEntry> = {};
      visibleMarkets.forEach((m) => {
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

      fetchHistory(visibleMarkets);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (visibleMarkets: Market[]) => {
    try {
      const res = await fetch("/api/admin/history");
      const data = await res.json();
      const items: HistoryItem[] = data.results || [];

      const allowedIds = new Set(visibleMarkets.map((m) => m.id));
      const filtered = items.filter((h) => allowedIds.has(h.marketId));
      setHistory(filtered);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) return;

    setLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password");
      }

      const userProfile: CurrentUser = data.user;
      sessionStorage.setItem("admin_authenticated", "true");
      sessionStorage.setItem("admin_user", JSON.stringify(userProfile));
      setCurrentUser(userProfile);
      setIsAuthenticated(true);
      loadDashboardData(userProfile);
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_user");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsernameInput("");
    setPasswordInput("");
  };

  const handlePannaChange = (
    marketId: string,
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

      return {
        ...prev,
        [marketId]: {
          ...current,
          [field]: cleanVal,
          [isFieldOpen ? "openD" : "closeD"]: sumDigit,
          [isFieldOpen ? "openError" : "closeError"]: isInvalid,
        },
      };
    });
  };

  const handleHolidayToggle = (marketId: string) => {
    setEntries((prev) => ({
      ...prev,
      [marketId]: {
        ...prev[marketId],
        isHoliday: !prev[marketId]?.isHoliday,
      },
    }));
  };

  // Requirement 3: Edit mistakes from history directly into the form
  const handleEditFromHistory = (item: HistoryItem) => {
    const formattedDate = new Date(item.date).toISOString().split("T")[0];
    setSelectedDate(formattedDate);

    const isHol = item.openPanna === "***" && item.closePanna === "***";
    const openP = isHol || item.openPanna === "***" ? "" : item.openPanna;
    const closeP = isHol || item.closePanna === "***" ? "" : item.closePanna;

    setEntries((prev) => ({
      ...prev,
      [item.marketId]: {
        openPanna: openP,
        openD: openP ? calculateSumDigit(openP) : "",
        closePanna: closeP,
        closeD: closeP ? calculateSumDigit(closeP) : "",
        openError: false,
        closeError: false,
        isHoliday: isHol,
      },
    }));

    window.scrollTo({ top: 0, behavior: "smooth" });
    setSuccessMessage(`Editing ${item.market.name} for date ${formattedDate}. Update values and click Save.`);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const handleSave = async (specificMarketId?: string) => {
    const hasErrors = Object.values(entries).some((e) => e.openError || e.closeError);
    if (hasErrors) {
      setErrorMessage("Please fix invalid ascending Panna digits before saving.");
      return;
    }

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const targetMarkets = specificMarketId
        ? markets.filter((m) => m.id === specificMarketId)
        : markets;

      const payload = targetMarkets.map((m) => {
        const data = entries[m.id] || {
          openPanna: "",
          openD: "",
          closePanna: "",
          closeD: "",
          isHoliday: false,
        };

        let jodi = "";
        if (data.isHoliday) {
          jodi = "**";
        } else if (data.openD && data.closeD) {
          jodi = `${data.openD}${data.closeD}`;
        } else if (data.openD) {
          jodi = `${data.openD}*`;
        }

        return {
          marketId: m.id,
          date: selectedDate,
          openPanna: data.isHoliday ? "***" : data.openPanna || "",
          closePanna: data.isHoliday ? "***" : data.closePanna || "",
          jodi: jodi,
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

      setSuccessMessage("Results uploaded & live website updated successfully!");
      fetchHistory(markets);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update results");
    } finally {
      setSaving(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
        Authenticating...
      </div>
    );
  }

  // Client Username/Password Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 mx-auto flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 text-center tracking-tight">Client Admin Portal</h2>
          <p className="text-xs text-slate-500 text-center mt-1 mb-6">Enter assigned credentials to access your market</p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. kalyan_admin"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loginError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 py-2 px-3 rounded-lg">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn || !usernameInput || !passwordInput}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition text-sm cursor-pointer shadow-md disabled:opacity-50"
            >
              {loggingIn ? "Verifying..." : "Sign In to Portal"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              ← Return to Live Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-28">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              title="Return to Public Website"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Market Operator Portal</h1>
                {currentUser && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {currentUser.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {currentUser?.role === "superadmin"
                  ? "All markets accessible (Super Admin Mode)"
                  : "Authorized market management & result history"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Date for Upload:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="text-xs font-medium text-slate-500">
            Visible Markets: <span className="font-bold text-slate-800">{markets.length}</span>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* Market Cards */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading market dashboard...</div>
        ) : markets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            No authorized markets configured for your user account. Please contact the platform admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {markets.map((market) => {
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
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Upload Window
                    </span>
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                      Open: {market.openTime} | Close: {market.closeTime}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-wide uppercase">
                      {market.name}
                    </h2>

                    {/* Open Panna Field */}
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
                          className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm font-bold text-center tracking-widest outline-none transition ${
                            data.openError
                              ? "border-rose-500 text-rose-600 bg-rose-50"
                              : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          } disabled:bg-slate-100`}
                        />
                        <div
                          className={`w-12 h-9.5 rounded-lg flex items-center justify-center font-extrabold text-sm shadow-xs ${
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
                          Panna digits must be ascending (e.g. 123)
                        </p>
                      )}
                    </div>

                    {/* Close Panna Field */}
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
                          className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm font-bold text-center tracking-widest outline-none transition ${
                            data.closeError
                              ? "border-rose-500 text-rose-600 bg-rose-50"
                              : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          } disabled:bg-slate-100`}
                        />
                        <div
                          className={`w-12 h-9.5 rounded-lg flex items-center justify-center font-extrabold text-sm shadow-xs ${
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
                          Panna digits must be ascending (e.g. 123)
                        </p>
                      )}
                    </div>

                    {/* Holiday */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={data.isHoliday}
                          onChange={() => handleHolidayToggle(market.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        Market Holiday
                      </label>

                      <button
                        type="button"
                        onClick={() => handleSave(market.id)}
                        disabled={saving}
                        className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload History & In-Line Edit */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload History</h3>
              <p className="text-xs text-slate-500">
                Ordered log of declared results. Click <strong>Edit</strong> on any entry to fix incorrect opening/closing numbers.
              </p>
            </div>
            <button
              onClick={() => fetchHistory(markets)}
              className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              Refresh Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time Uploaded</th>
                  <th className="py-3 px-3">Market</th>
                  <th className="py-3 px-3 text-center">Open Panna</th>
                  <th className="py-3 px-3 text-center">Jodi</th>
                  <th className="py-3 px-3 text-center">Close Panna</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No upload records found for authorized markets.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const rowDate = new Date(item.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    const uploadTime = new Date(item.updatedAt || item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-800">{rowDate}</td>
                        <td className="py-3 px-3 text-slate-500">{uploadTime}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 uppercase">
                          {item.market.name}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {item.openPanna || "-"}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-amber-600">
                          {item.jodi || "-"}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {item.closePanna || "-"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditFromHistory(item)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded font-bold transition cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Save All */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 hidden sm:block">
            Uploading results updates both the live site and panel charts instantly.
          </p>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="w-full sm:w-auto sm:min-w-[240px] ml-auto bg-slate-900 text-white py-2.5 px-6 rounded-lg font-bold text-sm tracking-wide shadow-md hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {saving ? "Publishing..." : "Save & Update Live"}
          </button>
        </div>
      </footer>
    </div>
  );
}