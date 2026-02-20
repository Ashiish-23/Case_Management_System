import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

/* ================= CONFIG ================= */
const API_BASE = "http://localhost:5000";
const SOCKET_URL = "http://localhost:5000";

/* ================= FETCH ================= */
async function secureFetch(url) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok)
    throw new Error("Fetch failed");
  return res.json();
}

/* ================= COMPONENT ================= */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  /* ================= LOAD INITIAL DATA ================= */
  async function loadInitial() {
    try {
      const statsData = await secureFetch(`${API_BASE}/api/admin/stats`);
      const auditData = await secureFetch(`${API_BASE}/api/admin/audit?limit=10`);
      setStats(statsData);
      setActivity(auditData.data || []);
    } catch (err) {
      console.error("Initial load error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= SOCKET.IO SETUP ================= */
  useEffect(() => {
    loadInitial();
    const token = sessionStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });
    socketRef.current = socket;

    /* ================= EVENT: NEW ACTIVITY ================= */
    socket.on("admin:activity", (newLog) => {
      setActivity(prev => [
        newLog,
        ...prev.slice(0, 9)
      ]);
    });

    /* ================= EVENT: STATS UPDATE ================= */
    socket.on("admin:stats", (newStats) => {
      setStats(newStats);
    });

    /* ================= FALLBACK POLLING ================= */
    const polling = setInterval(loadInitial, 30000);
    return () => {
      socket.disconnect();
      clearInterval(polling);
    };
  }, []);

  /* ================= LOADING ================= */
  if (loading)
    return (
      <div className="text-center py-24 text-slate-400">Loading system overview... </div>
    );

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white"> System Overview </h1>
        <p className="text-slate-400 text-sm">Administrative control and monitoring dashboard </p>
      </div>

      {/* COMPACT STATUS BAR */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-4">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
          <StatusItem label="Officers" value={stats.totalUsers} />
          <StatusItem label="Cases" value={stats.totalCases} />
          <StatusItem label="Evidence" value={stats.totalEvidence} />
          <StatusItem label="Transfers" value={stats.totalTransfers} />
          <StatusItem label="Stations" value={stats.totalStations} />
          <StatusItem label="Status" value="Operational" status="ok" />
        </div>
      </div>

      {/* LIVE ACTIVITY */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="text-white font-semibold mb-4">Live Activity</div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activity.length === 0 && (
            <div className="text-slate-400 text-sm"> No recent activity </div>
          )}

          {activity.map(log => (
            <ActivityItem key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= STATUS ITEM ================= */
function StatusItem({ label, value, status }) {
  const color =
    status === "ok"
      ? "text-green-400"
      : "text-white";
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">
        {label}:
      </span>

      <span className={`font-semibold ${color}`}>
        {value}
      </span>
    </div>
  );
}

/* ================= ACTIVITY ITEM ================= */
function ActivityItem({ log }) {
  return (
    <div className="text-sm border-b border-slate-700 pb-2">
      <span className="text-white">
        {log.actor_name}
      </span>

      <span className="text-slate-400">
        {" "}→ {log.action_type}
      </span>

      <span className="text-slate-500 ml-2 text-xs">
        {new Date(log.created_at).toLocaleTimeString()}
      </span>
    </div>
  );
}
