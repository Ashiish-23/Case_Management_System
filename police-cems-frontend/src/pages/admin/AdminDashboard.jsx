import { useEffect, useState } from "react";

/* ================= SECURE FETCH ================= */

async function secureFetch(url) {
  const token = sessionStorage.getItem("token");

  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

/* ================= COMPONENT ================= */

export default function AdminDashboard() {

  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  /* ================= LOAD OVERVIEW ================= */

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      const data = await secureFetch(
        "http://localhost:5000/api/admin/audit/overview"
      );
      setOverview(data);
    } catch (err) {
      console.error("Overview error:", err.message);
    } finally {
      setLoadingOverview(false);
    }
  }

  /* ================= LOAD AUDIT LOGS ================= */

  useEffect(() => {
    loadLogs();
  }, [page]);

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const result = await secureFetch(
        `http://localhost:5000/api/admin/audit?page=${page}&limit=20`
      );
      setLogs(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error("Audit error:", err.message);
    } finally {
      setLoadingLogs(false);
    }
  }

  function goToPage(p) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  }

  /* ================= UI ================= */

  return (
    <div className="px-8 py-8 text-white max-w-screen-2xl mx-auto">

      {/* ================= SYSTEM OVERVIEW ================= */}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          System Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Administrative control and monitoring dashboard
        </p>
      </div>

      {loadingOverview ? (
  <div className="text-slate-400 mb-8">
    Loading system statistics...
  </div>
) : overview && (
  <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-lg px-6 py-4 shadow-sm mb-8">
    <div className="flex justify-between items-center text-xs">

      <OverviewItem label="Officers" value={overview.officers} />
      <OverviewItem label="Cases" value={overview.cases} />
      <OverviewItem label="Evidence" value={overview.evidence} />
      <OverviewItem label="Transfers" value={overview.transfers} />
      <OverviewItem label="Stations" value={overview.stations} />

    </div>
  </div>
)}

      {/* ================= AUDIT LOGS ================= */}

      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">

        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold">
            System Activity Logs
          </h2>
        </div>

        {loadingLogs ? (
          <div className="p-6 text-slate-400">
            Loading audit logs...
          </div>
        ) : (
          <table className="w-full text-sm">

            <thead className="bg-slate-950 text-slate-300 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 text-left">Time</th>
                <th className="px-6 py-4 text-left">Actor</th>
                <th className="px-6 py-4 text-left">Action</th>
                <th className="px-6 py-4 text-left">Target</th>
                <th className="px-6 py-4 text-left">Details</th>
              </tr>
            </thead>

            <tbody>
              {logs.map(log => (
                <tr
                  key={log.id}
                  className="border-t border-slate-800 hover:bg-slate-800/50 transition"
                >
                  <td className="px-6 py-4 text-slate-300">
                    {new Date(log.created_at).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {log.actor_name}
                  </td>

                  <td className="px-6 py-4 font-mono text-blue-400">
                    {log.action_type}
                  </td>

                  <td className="px-6 py-4">
                    {log.target_type}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-400 max-w-md truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}

        {/* ================= PAGINATION ================= */}

        <div className="flex justify-center items-center gap-3 py-6 border-t border-slate-800">

          <button
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md text-sm disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={
                  page === p
                    ? "bg-blue-600 px-4 py-2 rounded-md text-sm"
                    : "bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md text-sm"
                }
              >
                {p}
              </button>
            );
          })}

          <button
            disabled={page === totalPages}
            onClick={() => goToPage(page + 1)}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md text-sm disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}

/* ================= SMALL OVERVIEW ITEM ================= */

function OverviewItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-slate-500 uppercase tracking-wide text-[10px]">
        {label}
      </span>
      <span className="text-white text-base font-semibold">
        {value ?? 0}
      </span>
    </div>
  );
}