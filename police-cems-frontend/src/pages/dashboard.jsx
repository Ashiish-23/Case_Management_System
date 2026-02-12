import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

/* ================= COMPONENT ================= */

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  /* ===== PAGINATION STATE ===== */

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ================= LOAD STATS ================= */

  useEffect(() => {

    const token = sessionStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const headers = {
      Authorization: "Bearer " + token
    };

    async function loadStats() {

      try {

        const res = await secureFetch(
          "http://localhost:5000/api/dashboard/stats",
          { headers }
        );

        if (res.status === 401 || res.status === 403) {

          sessionStorage.clear();
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

  /* ================= LOAD CASES WITH PAGINATION ================= */

  useEffect(() => {

    const token = sessionStorage.getItem("token");

    if (!token) return;

    const headers = {
      Authorization: "Bearer " + token
    };

    const delay = setTimeout(async () => {

      try {

        setLoading(true);

        const res = await secureFetch(
          `http://localhost:5000/api/cases?page=${page}&limit=15&search=${encodeURIComponent(searchTerm)}`,
          { headers }
        );

        if (res.status === 401 || res.status === 403) {

          sessionStorage.clear();
          navigate("/login", { replace: true });
          return;

        }

        if (!res.ok) {
          throw new Error("Cases load failed");
        }

        const result = await res.json();

        setCases(result.data || []);
        setTotalPages(result.totalPages || 1);

      } catch (err) {

        console.error("Cases load error:", err.message);
        setCases([]);

      } finally {

        setLoading(false);

      }

    }, 300);

    return () => clearTimeout(delay);

  }, [searchTerm, page, navigate]);

  /* ===== RESET PAGE WHEN SEARCH CHANGES ===== */

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  /* ================= UI ================= */

  return (

    <div className="pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">

      {/* HEADER */}

      <div className="mb-6">

        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Officer Dashboard
        </h2>

        <p className="text-white text-sm mt-1">
          Overview of registered cases and secure evidence ledger
        </p>

      </div>

      {/* STATS */}

      <div className="mb-8 bg-blue-700/50 border border-slate-700 rounded-xl">

        <MarqueeStats stats={stats} />

      </div>

      {/* CASE TABLE */}

      {loading ? (

        <div className="flex flex-col items-center justify-center py-24">

          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>

          <p className="text-white">
            Loading secure case records…
          </p>

        </div>

      ) : (

        <div className="bg-blue-900/50 border border-slate-700 rounded-xl shadow-xl">

          <CaseTable
            cases={cases}
            setSearchTerm={setSearchTerm}
          />

        </div>

      )}

      {/* PAGINATION */}

      <div className="flex justify-center items-center gap-4 mt-6 mb-10">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-slate-800 rounded text-white disabled:opacity-40 hover:bg-slate-700"
        >
          Previous
        </button>

        <span className="text-white font-medium">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-slate-800 rounded text-white disabled:opacity-40 hover:bg-slate-700"
        >
          Next
        </button>

      </div>

    </div>

  );

}
