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

  if (!res.ok)
    throw new Error(data.error || "Request failed");

  return data;
}


/* ================= COMPONENT ================= */

export default function AdminUsers() {

  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  /* ================= GET CURRENT ADMIN ================= */

  let adminId = null;

  try {

    const token = sessionStorage.getItem("token");

    if (token) {

      const decoded = jwtDecode(token);
      adminId = decoded.userId;

    }

  }
  catch { error}



  /* ================= LOAD USERS ================= */

  const loadUsers = useCallback(async () => {

    try {

      setLoading(true);
      setError(null);

      const result =
        await secureFetch(
          `http://localhost:5000/api/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`
        );

      setUsers(result.data || []);
      setTotalPages(result.totalPages || 1);

    }
    catch (err) {

      setError(err.message);

    }
    finally {

      setLoading(false);

    }

  }, [page, search]);


  /* ================= LOAD STATIONS ================= */

  const loadStations = useCallback(async () => {

    try {

      const result =
        await secureFetch(
          "http://localhost:5000/api/admin/stations?page=1&limit=100"
        );

      setStations(result.data || []);

    }
    catch {

      setStations([]);

    }

  }, []);


  useEffect(() => {

    loadUsers();
    loadStations();

  }, [loadUsers, loadStations]);


  /* ================= ACTIONS ================= */

  async function approveUser(id) {

    try {

      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/approve`,
        { method: "PATCH" }
      );

      loadUsers();

    }
    catch (err) {

      alert(err.message);

    }

  }


  async function blockUser(id) {

    if (!confirm("Block this user?")) return;

    try {

      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/block`,
        { method: "PATCH" }
      );

      loadUsers();

    }
    catch (err) {

      alert(err.message);

    }

  }


  async function changeRole(id, role) {

    if (!role) return;

    try {

      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role })
        }
      );

      loadUsers();

    }
    catch (err) {

      alert(err.message);

    }

  }


  async function assignStation(id, stationName) {

    if (!stationName) return;

    try {

      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/station`,
        {
          method: "POST",
          body: JSON.stringify({
            station_name: stationName
          })
        }
      );

      loadUsers();

    }
    catch (err) {

      alert(err.message);

    }

  }


  function handleSearch() {

    setPage(1);
    setSearch(searchInput.trim());

  }


  /* ================= UI ================= */

  return (

    <div className="pt-6 px-6 max-w-screen-2xl mx-auto text-white">

      {/* HEADER */}

      <div className="mb-6">

        <h1 className="text-2xl font-semibold">
          User Management
        </h1>

        <p className="text-slate-400 text-sm">
          Approve, block, assign stations, and manage roles
        </p>

      </div>



      {/* SEARCH */}

      <div className="flex justify-between mb-4">

        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search users..."
          className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg w-80"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          Search
        </button>

      </div>



      {/* TABLE */}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-900">

            <tr>

              <th className="p-3 text-left">Login ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Station</th>
              <th className="p-3 text-left">Actions</th>

            </tr>

          </thead>


          <tbody>

            {loading &&
              <tr>
                <td colSpan="5" className="text-center p-6">
                  Loading users...
                </td>
              </tr>
            }


            {error &&
              <tr>
                <td colSpan="5" className="text-center text-red-400 p-6">
                  {error}
                </td>
              </tr>
            }


            {!loading && users.map(user => {

              const isSelf = user.id === adminId;

              return (

                <tr key={user.id} className="border-t border-slate-700">

                  <td className="p-3">{user.login_id}</td>

                  <td className="p-3">
                    {user.full_name}
                    {isSelf && " (You)"}
                  </td>

                  <td className="p-3">
                    <StatusBadge status={user.status}/>
                  </td>

                  <td className="p-3">
                    {user.current_station || "—"}
                  </td>

                  <td className="p-3 flex gap-2 flex-wrap">

                    {!isSelf && user.status === "pending" &&
                      <button
                        onClick={() => approveUser(user.id)}
                        className="bg-green-600 px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                    }


                    {!isSelf &&
                      <button
                        onClick={() => blockUser(user.id)}
                        className="bg-red-600 px-3 py-1 rounded"
                      >
                        Block
                      </button>
                    }


                    {!isSelf &&
                      <select
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        className="bg-slate-700 px-2 py-1 rounded"
                      >
                        <option value="">Role</option>
                        <option>Constable</option>
                        <option>Inspector</option>
                        <option>SP</option>
                      </select>
                    }


                    {!isSelf &&
                      <select
                        onChange={(e) => assignStation(user.id, e.target.value)}
                        className="bg-slate-700 px-2 py-1 rounded"
                      >
                        <option value="">Assign Station</option>

                        {stations.map(st =>
                          <option key={st.id} value={st.name}>
                            {st.name}
                          </option>
                        )}

                      </select>
                    }

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>


        {/* PAGINATION */}

        <div className="flex justify-center gap-2 p-4">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="bg-slate-700 px-3 py-1 rounded"
          >
            Prev
          </button>


          {[...Array(totalPages)].map((_, i) => (

            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={
                page === i + 1
                  ? "bg-blue-600 px-3 py-1 rounded"
                  : "bg-slate-700 px-3 py-1 rounded"
              }
            >
              {i + 1}
            </button>

          ))}


          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="bg-slate-700 px-3 py-1 rounded"
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
    return <span className="text-green-400">Approved</span>;

  if (status === "blocked")
    return <span className="text-red-400">Blocked</span>;

  return <span className="text-yellow-400">Pending</span>;

}