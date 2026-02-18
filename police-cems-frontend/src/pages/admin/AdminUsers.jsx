import { useEffect, useState, useCallback } from "react";

/* ================= FETCH HELPER ================= */
async function secureFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

/* ================= COMPONENT ================= */
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  /* ================= LOAD USERS ================= */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await secureFetch(
        `http://localhost:5000/api/admin/users?page=${page}&limit=15`
      );
      setUsers(result.data || []);
      setTotalPages(result.totalPages || 1);
    }
    catch (err) {
      console.error("Users load error:", err.message);
    }
    finally {
      setLoading(false);
    }}, [page]);

  /* ================= LOAD STATIONS ================= */
  const loadStations = useCallback(async () => {
    try {
      const result = await secureFetch(
        `http://localhost:5000/api/admin/stations?page=1&limit=100`
      );
      setStations(result.data || []);
    }
    catch (err) {
      console.error("Stations load error:", err.message);
    }}, []);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    loadUsers();
    loadStations();
  }, [loadUsers, loadStations]);

  /* ================= APPROVE ================= */
  async function approveUser(id) {
    try {
      setActionLoading(id);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/approve`,
        { method: "PATCH" }
      );
      loadUsers();
    }
    finally {
      setActionLoading(null);
    }
  }

  /* ================= BLOCK ================= */
  async function blockUser(id) {
    if (!window.confirm("Block this officer?")) return;
    try {
      setActionLoading(id);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/block`,
        { method: "PATCH" }
      );
      loadUsers();
    }
    finally {
      setActionLoading(null);
    }
  }

  /* ================= CHANGE ROLE ================= */
  async function changeRole(userId, role) {
    try {
      setActionLoading(userId);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role })
        }
      );
      loadUsers();
    }
    finally {
      setActionLoading(null);
    }
  }

  /* ================= ASSIGN STATION ================= */
  async function assignStation(userId, stationName) {
    try {
      setActionLoading(userId);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${userId}/station`,
        {
          method: "POST",
          body: JSON.stringify({
            station_name: stationName
          })
        }
      );
      loadUsers();
    }
    finally {
      setActionLoading(null);
    }
  }

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading officers...
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* TABLE */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 font-semibold">
          Officer Management
        </div>

        <table className="w-full">
          <thead className="bg-slate-900 text-sm">
            <tr>
              <th className="p-4 text-left">Login ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Station</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr
                key={user.id}
                className="border-t border-slate-700 hover:bg-slate-700/30">

                <td className="p-4 font-mono">
                  {user.login_id}
                </td>

                <td className="p-4">
                  {user.full_name}
                </td>

                <td className="p-4 text-slate-400">
                  {user.email || "—"}
                </td>

                {/* ROLE */}
                <td className="p-4">
                  {user.role === "admin"
                    ? "admin"
                    : (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          changeRole(user.id, e.target.value)
                        }
                        className="bg-slate-700 px-2 py-1 rounded">
                        <option value="constable">Constable</option>
                        <option value="head constable">Head Constable</option>
                        <option value="sub-inspector">Sub Inspector</option>
                        <option value="inspector">Inspector</option>
                        <option value="dsp">DSP</option>
                      </select>
                    )}
                </td>

                {/* STATION */}
                <td className="p-4">
                  {user.role === "admin"
                    ? "HQ"
                    : (
                      <select
                        value={user.current_station || ""}
                        onChange={(e) =>
                          assignStation(user.id, e.target.value)
                        }
                        className="bg-slate-700 px-2 py-1 rounded">
                        <option value="">
                          Unassigned
                        </option>

                        {stations.map(st => (
                          <option key={st.name} value={st.name}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    )}
                </td>

                {/* STATUS */}
                <td className="p-4">
                  <StatusBadge status={user.status} />
                </td>

                {/* ACTIONS */}
                <td className="p-4 flex gap-2">
                  {user.status === "pending" && (
                    <button
                      disabled={actionLoading === user.id}
                      onClick={() => approveUser(user.id)}
                      className="px-3 py-1 bg-green-600 rounded" > Approve </button>
                  )}

                  {user.role !== "admin" && (
                    <button
                      disabled={actionLoading === user.id}
                      onClick={() => blockUser(user.id)}
                      className="px-3 py-1 bg-red-600 rounded"> Block </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-slate-700 rounded disabled:opacity-40" > Previous </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-slate-700 rounded disabled:opacity-40" > Next </button>
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
