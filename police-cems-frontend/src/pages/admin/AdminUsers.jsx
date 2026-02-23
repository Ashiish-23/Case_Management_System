import { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

/* ================= SECURE FETCH ================= */

async function secureFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      ...options.headers
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* ================= COMPONENT ================= */

export default function AdminUsers() {

  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [busyUserId, setBusyUserId] = useState(null);

  let adminId = null;
  try {
    const token = sessionStorage.getItem("token");
    if (token) adminId = jwtDecode(token).userId;
  } catch { error }

  /* ================= LOAD USERS ================= */

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await secureFetch(
        `http://localhost:5000/api/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`
      );

      setUsers(result.data || []);
      setTotalPages(result.totalPages || 1);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadStations = useCallback(async () => {
    try {
      const result = await secureFetch(
        "http://localhost:5000/api/admin/stations?page=1&limit=100"
      );
      setStations(result.data || []);
    } catch {
      setStations([]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadStations();
  }, [loadUsers, loadStations]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  /* ================= ACTIONS ================= */

  async function approveUser(id) {
    try {
      setBusyUserId(id);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/approve`,
        { method: "PATCH" }
      );
      loadUsers();
    } finally {
      setBusyUserId(null);
    }
  }

  async function blockUser(id) {
    if (!confirm("Are you sure you want to block this user?"))
      return;

    try {
      setBusyUserId(id);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/block`,
        { method: "PATCH" }
      );
      loadUsers();
    } finally {
      setBusyUserId(null);
    }
  }

  async function changeRole(id, role) {
    if (!role) return;

    try {
      setBusyUserId(id);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role })
        }
      );
      loadUsers();
    } finally {
      setBusyUserId(null);
    }
  }

  async function assignStation(id, stationName) {
    if (!stationName) return;

    try {
      setBusyUserId(id);
      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/station`,
        {
          method: "POST",
          body: JSON.stringify({ station_name: stationName })
        }
      );
      loadUsers();
    } finally {
      setBusyUserId(null);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto text-white">

      {/* HEADER */}
      
      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-2xl font-semibold">
            User Management
          </h1>

          <p className="text-slate-400 text-sm">
            View and manage all registered users
          </p>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">

<div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">

  <div className="text-lg font-semibold">
    Registered Users
  </div>

  <div className="flex items-center gap-3">

    <input
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      placeholder="Search user name, login ID, email..."
      className="
        bg-slate-900
        border border-slate-700
        px-4 py-2
        rounded-lg
        w-80
        text-sm
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        transition
      "
    />

    <button
      onClick={handleSearch}
      className="
        bg-blue-600
        hover:bg-blue-500
        px-5 py-2
        rounded-lg
        text-sm
        font-medium
        transition
      "
    >
      Search
    </button>

  </div>

</div>
        <table className="w-full text-sm">
          

          <thead className="bg-slate-900 text-slate-300 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-6 py-4 text-left">Login ID</th>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Station</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-400">
                  Loading users...
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-red-400">
                  {error}
                </td>
              </tr>
            )}

            {!loading && users.map((user) => {

              const isSelf = user.id === adminId;
              const isBusy = busyUserId === user.id;

              return (
                <tr
                  key={user.id}
                  className="border-t border-slate-800 hover:bg-slate-800/50 transition"
                >

                  <td className="px-6 py-4 font-mono text-slate-300">
                    {user.login_id}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {user.full_name}
                    {isSelf && (
                      <span className="ml-2 text-xs text-slate-400">(You)</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>

                  <td className="px-6 py-4 text-slate-300">
                    {user.current_station || "—"}
                  </td>

                  <td className="px-6 py-4">

                    {!isSelf && (
                      <div className="flex flex-wrap gap-2">

                        {/* Pending → Approve / Block */}
                        {user.status === "pending" && (
                          <>
                            <button
                              disabled={isBusy}
                              onClick={() => approveUser(user.id)}
                              className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded-md text-xs font-medium disabled:opacity-40"
                            >
                              Approve
                            </button>

                            <button
                              disabled={isBusy}
                              onClick={() => blockUser(user.id)}
                              className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-xs font-medium disabled:opacity-40"
                            >
                              Block
                            </button>
                          </>
                        )}

                        {/* Approved → Block + Config */}
                        {user.status === "approved" && (
                          <>
                            <button
                              disabled={isBusy}
                              onClick={() => blockUser(user.id)}
                              className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-xs font-medium disabled:opacity-40"
                            >
                              Block
                            </button>

                            <select
                              disabled={isBusy}
                              onChange={(e) => changeRole(user.id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-xs px-2 py-1 rounded-md"
                            >
                              <option value="">Change Role</option>
                              <option>Constable</option>
                              <option>Inspector</option>
                              <option>SP</option>
                            </select>

                            <select
                              disabled={isBusy}
                              onChange={(e) => assignStation(user.id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-xs px-2 py-1 rounded-md"
                            >
                              <option value="">Assign Station</option>
                              {stations.map(st => (
                                <option key={st.id} value={st.name}>
                                  {st.name}
                                </option>
                              ))}
                            </select>
                          </>
                        )}

                        {/* Blocked → Reactivate */}
                        {user.status === "blocked" && (
                          <button
                            disabled={isBusy}
                            onClick={() => approveUser(user.id)}
                            className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded-md text-xs font-medium disabled:opacity-40"
                          >
                            Reactivate
                          </button>
                        )}

                      </div>
                    )}

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

        {/* PAGINATION */}

        <div className="flex justify-center items-center gap-3 py-6 border-t border-slate-800">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md text-sm disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={
                page === i + 1
                  ? "bg-blue-600 px-4 py-2 rounded-md text-sm"
                  : "bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md text-sm"
              }
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md text-sm disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }) {

  if (status === "approved")
    return (
      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
        Approved
      </span>
    );

  if (status === "blocked")
    return (
      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
        Blocked
      </span>
    );

  return (
    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
      Pending
    </span>
  );
}