import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Topbar from "../components/Topbar";
import MarqueeStats from "../components/MarqueeStats";
import CaseTable from "./CaseList";

/* ================= HELPERS ================= */

function safeInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

async function secureFetch(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= INITIAL LOAD (STATS) ================= */

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const headers = { Authorization: "Bearer " + token };

    async function loadStats() {
      try {
        const res = await secureFetch(
          "http://localhost:5000/api/dashboard/stats",
          { headers }
        );

        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        const data = await res.json();

        setStats([
          { label: "Total Cases", value: safeInt(data.totalCases) },
          { label: "Evidence Items", value: safeInt(data.evidenceItems) },
          { label: "Transfers", value: safeInt(data.transfers) }
        ]);

      } catch (err) {
        console.error("Stats load error:", err.message);
      }
    }

    loadStats();

  }, [navigate]);

  /* ================= CASE FETCH (WITH SEARCH) ================= */

  useEffect(() => {

    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: "Bearer " + token };

    const delay = setTimeout(async () => {

      try {

        setLoading(true);

        const res = await secureFetch(
          `http://localhost:5000/api/cases?limit=50&search=${encodeURIComponent(searchTerm)}`,
          { headers }
        );

        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        if (!res.ok) throw new Error("Cases load failed");

        const data = await res.json();

        if (Array.isArray(data)) {
          setCases(data);
        }

      } catch (err) {
        console.error("Cases load error:", err.message);
        setCases([]);
      } finally {
        setLoading(false);
      }

    }, 400); // debounce

    return () => clearTimeout(delay);

  }, [searchTerm, navigate]);

  /* ================= UI ================= */

  return (
    <div className="bg-blue-900 text-slate-100 min-h-screen flex flex-col">

      <Topbar />

      <main className="flex-grow pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">


        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Officer Dashboard
          </h2>
          <p className="text-white text-sm mt-1">
            Overview of registered cases and secure evidence ledger
          </p>
        </div>

        <div className="mb-8 bg-blue-700/50 border border-slate-700 rounded-xl">
          <MarqueeStats stats={stats} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white">Loading secure case records…</p>
          </div>
        ) : (
          <div className="bg-blue-900/50 border border-slate-700 rounded-xl shadow-xl">
            <CaseTable
              cases={cases}
              setSearchTerm={setSearchTerm}
            />
          </div>
        )}

      </main>
    </div>
  );
}
