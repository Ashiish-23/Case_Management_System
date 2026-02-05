import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Topbar from "../components/Topbar";
import MarqueeStats from "../components/MarqueeStats";
import CaseTable from "./CaseList";

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    /* ---------- DASHBOARD STATS ---------- */
    fetch("http://localhost:5000/api/dashboard/stats", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          navigate("/login");
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;

        setStats([
          { label: "Total Cases", value: data.totalCases },
          { label: "Evidence Items", value: data.evidenceItems },
          { label: "Transfers", value: data.transfers }
        ]);
      })
      .catch(console.error);

    /* ---------- CASE LIST ---------- */
    fetch("http://localhost:5000/api/cases", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

  }, [navigate]);

  return (
    <div className="min-h-screen bg-blue-900 text-slate-100">

      {/* GLOBAL TOPBAR */}
      <Topbar />

      {/* PAGE CONTENT */}
      <main className="pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto">

        {/* PAGE HEADER */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Officer Dashboard
          </h2>
          <p className="text-white text-sm mt-1">
            Overview of registered cases and secure evidence ledger
          </p>
        </div>

        {/* MARQUEE */}
        <div className="mb-8 bg-blue-700/50 border border-slate-700 rounded-xl overflow-hidden">
          <MarqueeStats stats={stats} />
        </div>

        {/* CASE TABLE */}
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
