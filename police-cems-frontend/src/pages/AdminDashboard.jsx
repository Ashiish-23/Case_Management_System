import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ================= FETCH HELPER ================= */
async function secureFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ADMIN DATA ================= */
  useEffect(() => {
    async function load() {
      try {
        /* LOAD STATS */
        const statsRes =
          await secureFetch("http://localhost:5000/api/admin/stats");

        if (statsRes.status === 403) {
          alert("Administrator access required");
          navigate("/dashboard");
          return;
        }
        const statsData = await statsRes.json();
        setStats(statsData);

        /* LOAD USERS */
        const usersRes =
          await secureFetch("http://localhost:5000/api/admin/users");

        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);

        /* LOAD STATIONS */
        const stationsRes =
          await secureFetch("http://localhost:5000/api/admin/stations");

        const stationsData = await stationsRes.json();
        setStations(Array.isArray(stationsData) ? stationsData : []);
      }
      catch (err) {
        console.error("Admin load error:", err);
      }
      finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  /* ================= RELOAD USERS ================= */
  async function reloadUsers() {
    const res =
      await secureFetch("http://localhost:5000/api/admin/users");

    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  /* ================= APPROVE USER ================= */
  async function approveUser(id) {
    await secureFetch(
      `http://localhost:5000/api/admin/users/${id}/approve`,
      { method: "PATCH" }
    );
    reloadUsers();
  }

  /* ================= BLOCK USER ================= */
  async function blockUser(id) {
    await secureFetch(
      `http://localhost:5000/api/admin/users/${id}/block`,
      { method: "PATCH" }
    );
    reloadUsers();
  }

  /* ================= CHANGE ROLE ================= */
  async function changeRole(userId, newRole) {
    await secureFetch(
      `http://localhost:5000/api/admin/users/${userId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role: newRole })
      }
    );
    reloadUsers();
  }

  /* ================= ASSIGN STATION ================= */
  async function assignStation(userId, stationId) {
    await secureFetch(
      `http://localhost:5000/api/admin/users/${userId}/station`,
      {
        method: "PATCH",
        body: JSON.stringify({ stationId })
      }
    );
    reloadUsers();
  }

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading Admin Control Panel...
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="p-8 text-white max-w-screen-2xl mx-auto">

      {/* TITLE */}
      <h1 className="text-3xl font-bold mb-8 text-center">
        Administrator Control Panel
      </h1>

      {/* ================= STATS ================= */}

      <div className="flex gap-4 mb-10 flex-wrap justify-center">
        <StatCard label="Total Users" value={stats.totalUsers || 0} />
        <StatCard label="Total Cases" value={stats.totalCases || 0} />
        <StatCard label="Total Evidence" value={stats.totalEvidence || 0} />
        <StatCard label="Total Transfers" value={stats.totalTransfers || 0} />
        <StatCard label="Total Stations" value={stats.totalStations || 0} />
      </div>

      {/* ================= USERS TABLE ================= */}
      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">

        <div className="px-6 py-4 bg-slate-900 font-semibold">
          Registered Officers
        </div>

        <table className="w-full">
          <thead className="bg-slate-900 text-sm text-slate-300">
            <tr>
              <th className="p-4 text-left">Login ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Station</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>

            {users.map(user => (
              <tr
                key={user.id}
                className="border-t border-slate-700 hover:bg-slate-700/40"
              >

                {/* LOGIN */}
                <td className="p-4 font-mono">{user.login_id}</td>

                {/* NAME */}
                <td className="p-4">{user.full_name}</td>

                {/* ROLE SELECT */}
                <td className="p-4">

                  {user.role === "admin"
                    ? "admin"
                    : (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          changeRole(user.id, e.target.value)
                        }
                        className="bg-slate-700 px-2 py-1 rounded"
                      >
                        <option>constable</option>
                        <option>head constable</option>
                        <option>sub-inspector</option>
                        <option>inspector</option>
                        <option>dsp</option>
                      </select>
                    )
                  }
                </td>

                {/* STATION SELECT */}
                <td className="p-4">

                  {user.role === "admin"
                    ? "HQ"
                    : (
                      <select
                        value={user.station_id || ""}
                        onChange={(e) =>
                          assignStation(user.id, e.target.value)
                        }
                        className="bg-slate-700 px-2 py-1 rounded"
                      >

                        <option value="">Unassigned</option>

                        {stations.map(station => (

                          <option
                            key={station.id}
                            value={station.id}
                          >
                            {station.station_name}
                          </option>
                        ))}
                      </select>
                    )
                  }
                </td>

                {/* EMAIL */}
                <td className="p-4 text-sm text-slate-400">
                  {user.email}
                </td>

                {/* STATUS */}
                <td className="p-4">
                  <StatusBadge status={user.status} />
                </td>

                {/* ACTIONS */}
                <td className="p-4 flex gap-2">

                  {user.status === "pending" && user.role !== "admin" && (
                    <button
                      onClick={() => approveUser(user.id)}
                      className="px-3 py-1 bg-green-600 rounded hover:bg-green-500"
                    >
                      Approve
                    </button>
                  )}

                  {user.role !== "admin" && (
                    <button
                      onClick={() => blockUser(user.id)}
                      className="px-3 py-1 bg-red-600 rounded hover:bg-red-500"
                    >
                      Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ label, value }) {
  return (
    <div className="bg-slate-800 border border-slate-700 px-6 py-4 rounded-xl min-w-[180px]">

      <div className="text-slate-400 text-sm">
        {label}
      </div>

      <div className="text-3xl font-bold">
        {value}
      </div>
    </div>
  );
}

/* ================= STATUS BADGE ================= */
function StatusBadge({ status }) {

  if (status === "active")
    return <span className="text-green-400">Active</span>;

  if (status === "blocked")
    return <span className="text-red-400">Blocked</span>;

  return <span className="text-yellow-400">Pending</span>;
}
