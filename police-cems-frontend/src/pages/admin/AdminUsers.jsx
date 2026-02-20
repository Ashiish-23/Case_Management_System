import { useEffect, useState, useCallback } from "react";
import { useNavigate} from "react-router-dom";

/* ================= FETCH ================= */
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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ================= LOAD USERS ================= */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await secureFetch(
        `http://localhost:5000/api/admin/users?page=${page}&search=${search}&limit=15`
      );
      setUsers(result.data || []);
      setTotalPages(result.totalPages || 1);
    }
    catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  /* ================= LOAD STATIONS ================= */
  const loadStations = useCallback(async () => {
    try {
      const result = await secureFetch(
        `http://localhost:5000/api/admin/stations?limit=100`
      );
      setStations(result.data || []);
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadStations();
  }, [loadUsers, loadStations]);

  /* ================= ACTIONS ================= */
  async function approveUser(id) {
    await secureFetch(
      `http://localhost:5000/api/admin/users/${id}/approve`,
      { method: "PATCH" }
    );
    loadUsers();
  }

  async function blockUser(id) {
    if (!confirm("Block this officer?")) return;

    await secureFetch(
      `http://localhost:5000/api/admin/users/${id}/block`,
      { method: "PATCH" }
    );
    loadUsers();
  }

  async function changeRole(id, role) {
    if (!role) return;

    await secureFetch(
      `http://localhost:5000/api/admin/users/${id}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role })
      }
    );
    loadUsers();
  }

  async function assignStation(id, stationId) {

    if (!stationId) return;

    await secureFetch(
      `http://localhost:5000/api/admin/users/${id}/station`,
      {
        method: "POST",
        body: JSON.stringify({ station_id: stationId })
      }
    );
    loadUsers();
  }

  function handleSearch() {
    setPage(1);
    setSearch(searchInput);
  }

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* PAGE HEADER */}
      {/* BACK BUTTON */}
      <div className="mb-4">
        <button onClick={() => navigate("/admin")}
        className="bg-slate-800 hover:bg-slate-700 border border-slate-400 px-4 py-2 rounded-lg text-sm"> ← Back to Dashboard </button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl text-center font-semibold text-white"> Officer Management </h1>
        <p className="text-slate-400 mt-1 text-center">Approve officers, assign roles, and manage station assignments </p>
      </div>

      {/* TABLE */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Login ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Officer Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Actions</th>
                    <div className="flex justify-between items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
        <div className="flex gap-2">
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search officer..."
          className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-white w-80" />
          
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"> Search </button>
        </div>
      </div>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-slate-400">
                  Loading officers...
                </td>
              </tr>
            )}
            {!loading && users.map(user => (
              <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700">

                <td className="px-6 py-4 text-white text-sm">{user.login_id}</td>
                <td className="px-6 py-4 text-white text-sm font-medium">{user.full_name}</td>
                <td className="px-6 py-4 text-sm"><StatusBadge status={user.status}/></td>
                <td className="px-6 py-4 flex gap-2 flex-wrap">

                  <button onClick={() => approveUser(user.id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm">Approve</button>

                  <button onClick={() => blockUser(user.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm">Block</button>

                  <select onChange={(e) => changeRole(user.id, e.target.value)}
                    className="bg-slate-700 px-2 py-1 rounded text-sm">

                    <option value="">Change Role</option>
                    <option value="constable">Constable</option>
                    <option value="head constable">Head Constable</option>
                    <option value="sub-inspector">Sub-Inspector</option>
                    <option value="inspector">Inspector</option>
                    <option value="dsp">DSP</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select onChange={(e) => assignStation(user.id, e.target.value)}
                    className="bg-slate-700 px-2 py-1 rounded text-sm">

                    <option value="">Assign Station</option>
                    {stations.map(station => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="
  flex
  justify-between
  items-center
  mt-4
  bg-slate-800
  border border-slate-700
  rounded-xl
  px-4 py-3">

  <div className="text-slate-400 text-sm">

    Page {page} of {totalPages}

  </div>

  <div className="flex gap-2">

    <button
      disabled={page === 1}
      onClick={() => setPage(page - 1)}
      className="
        px-4 py-2
        bg-slate-700
        rounded
        disabled:opacity-40">

      Previous

    </button>

    <button
      disabled={page === totalPages}
      onClick={() => setPage(page + 1)}
      className="
        px-4 py-2
        bg-blue-600
        rounded
        disabled:opacity-40">

      Next

    </button>

  </div>

</div>

    </div>
  );
}

/* ================= STATUS BADGE ================= */
function StatusBadge({ status }) {

  if (status === "active")
    return <span className="text-green-400 font-medium">Active</span>;

  if (status === "blocked")
    return <span className="text-red-400 font-medium">Blocked</span>;

  return <span className="text-yellow-400 font-medium">Pending</span>;
}
