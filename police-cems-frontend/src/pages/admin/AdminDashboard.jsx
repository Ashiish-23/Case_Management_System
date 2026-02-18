import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ================= FETCH ================= */
async function secureFetch(url) {
  const token = sessionStorage.getItem("token");
  return fetch(url, {
    headers: {
      Authorization: "Bearer " + token
    }
  });
}

/* ================= COMPONENT ================= */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= LOAD STATS ================= */
  useEffect(() => {
    async function loadStats() {
      try {
        const res =
          await secureFetch(
            "http://localhost:5000/api/admin/stats"
          );

        if (res.status === 403) {
          navigate("/dashboard");
          return;
        }

        if (!res.ok)
          throw new Error("Failed to load stats");

        const data = await res.json();
        setStats(data);
      }
      catch (err) {
        console.error(err);
        setError("Failed to load admin stats");
      }
      finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [navigate]);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">

        <div className="text-slate-400">
          Loading system overview...
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (error) {
    return (
      <div className="text-red-400 p-6">
        {error}
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-10">
      {/* ================= TITLE ================= */}
      <div>
        <h2 className="text-2xl font-bold mb-2"> System Overview </h2>
        <p className="text-slate-400 text-sm"> Administrative control and monitoring dashboard </p>
      </div>

      {/* ================= STATS GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          onClick={() => navigate("/admin/users")}
        />

        <StatCard
          label="Total Cases"
          value={stats?.totalCases || 0}
          onClick={() => navigate("/admin/cases")}
        />

        <StatCard
          label="Total Evidence"
          value={stats?.totalEvidence || 0}
          onClick={() => navigate("/admin/evidence")}
        />

        <StatCard
          label="Transfers"
          value={stats?.totalTransfers || 0}
          onClick={() => navigate("/admin/transfers")}
        />

        <StatCard
          label="Stations"
          value={stats?.totalStations || 0}
          onClick={() => navigate("/admin/stations")}
        />
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">

        <h3 className="font-semibold mb-4">
          Quick Access
        </h3>

        <div className="flex flex-wrap gap-4">
          <QuickButton
            label="Manage Users"
            onClick={() => navigate("/admin/users")}
          />

          <QuickButton
            label="View Cases"
            onClick={() => navigate("/admin/cases")}
          />

          <QuickButton
            label="View Evidence"
            onClick={() => navigate("/admin/evidence")}
          />

          <QuickButton
            label="Transfers"
            onClick={() => navigate("/admin/transfers")}
          />

          <QuickButton
            label="Stations"
            onClick={() => navigate("/admin/stations")}
          />
        </div>
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ label, value, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:bg-slate-700 transition"
    >
      <div className="text-slate-400 text-sm mb-1">
        {label}
      </div>

      <div className="text-3xl font-bold">
        {value}
      </div>

    </div>
  );
}

/* ================= QUICK BUTTON ================= */
function QuickButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
    >{label} </button>
  );
}
