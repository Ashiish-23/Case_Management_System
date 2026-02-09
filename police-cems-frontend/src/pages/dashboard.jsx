import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Topbar from "../components/Topbar";
import MarqueeStats from "../components/MarqueeStats";
import CaseTable from "./CaseList";

/* ================= SECURITY HELPERS ================= */

function safeInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

async function secureFetch(url, options = {}, timeout = 10000) {

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    let mounted = true;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const headers = {
      Authorization: "Bearer " + token
    };

    async function loadDashboard() {

      try {

        /* ===== STATS ===== */
        const statsRes = await secureFetch(
          "http://localhost:5000/api/dashboard/stats",
          { headers }
        );

        if (statsRes.status === 401 || statsRes.status === 403) {
          localStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        const statsData = await statsRes.json();

        if (mounted && statsData) {
          setStats([
            { label: "Total Cases", value: safeInt(statsData.totalCases) },
            { label: "Evidence Items", value: safeInt(statsData.evidenceItems) },
            { label: "Transfers", value: safeInt(statsData.transfers) }
          ]);
        }

        /* ===== CASE LIST ===== */
        const caseRes = await secureFetch(
          "http://localhost:5000/api/cases?limit=50",
          { headers }
        );

        if (!caseRes.ok) throw new Error("Cases load failed");

        const caseData = await caseRes.json();

        if (mounted && Array.isArray(caseData)) {
          setCases(caseData);
        }

      } catch (err) {

        console.error("Dashboard load error:", err.message);

        if (mounted) {
          setCases([]);
          setStats([]);
        }

      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };

  }, [navigate]);

  return (
    <div className="min-h-screen bg-blue-900 text-slate-100">

      <Topbar />

      <main className="pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto">

        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Officer Dashboard
          </h2>
          <p className="text-white text-sm mt-1">
            Overview of registered cases and secure evidence ledger
          </p>
        </div>

        <div className="mb-8 bg-blue-700/50 border border-slate-700 rounded-xl overflow-hidden">
          <MarqueeStats stats={stats} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white">Loading secure case records…</p>
          </div>
        ) : (
          <div className="bg-blue-900/50 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
            <CaseTable cases={cases} />
          </div>
        )}

      </main>
    </div>
  );
}
