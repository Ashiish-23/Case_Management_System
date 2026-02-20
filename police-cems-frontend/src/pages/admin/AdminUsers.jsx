import { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

/* ================= SECURE FETCH ================= */

async function secureFetch(url, options = {}) {

  try {

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
      throw new Error(data.error || `Server error (${res.status})`);

    return data;

  }
  catch (err) {

    console.error("API Error:", err.message);
    throw err;

  }

}


/* ================= COMPONENT ================= */

export default function AdminUsers() {

  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);

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
  catch { error }


  /* ================= LOAD USERS ================= */

  const loadUsers = useCallback(async () => {

    try {

      setLoadingUsers(true);

      const result =
        await secureFetch(
          `http://localhost:5000/api/admin/users?page=${page}&search=${search}&limit=15`
        );

      setUsers(result.data || []);
      setTotalPages(result.totalPages || 1);

      setError(null);

    }
    catch {

      setError("Failed to load officers");

    }
    finally {

      setLoadingUsers(false);

    }

  }, [page, search]);


  /* ================= LOAD STATIONS ================= */
  /* UPDATED FOR NEW STATIONS TABLE STRUCTURE */

  const loadStations = useCallback(async () => {

    try {

      const result =
        await secureFetch(
          "http://localhost:5000/api/admin/stations?page=1&limit=100"
        );

      if (result && result.data)
        setStations(result.data);
      else
        setStations([]);

    }
    catch (err) {

      console.warn("Stations unavailable:", err.message);

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

      alert("Officer approved and email notification sent");

      loadUsers();

    }
    catch (err) {

      alert(err.message);

    }

  }


  async function blockUser(id) {

    if (!confirm("Block this officer?"))
      return;

    try {

      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/block`,
        { method: "PATCH" }
      );

      alert("Officer blocked and notified");

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


  async function assignStation(id, stationId) {

    if (!stationId) return;

    try {

      await secureFetch(
        `http://localhost:5000/api/admin/users/${id}/station`,
        {
          method: "POST",
          body: JSON.stringify({
            station_id: stationId
          })
        }
      );

      alert("Station assigned successfully");

      loadUsers();

    }
    catch (err) {

      alert(err.message);

    }

  }


  function handleSearch() {

    setPage(1);
    setSearch(searchInput);

  }


  /* ================= UI ================= */

  return (

    <div className="pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">


      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div className="gap-3">

          <h1 className="text-2xl font-semibold">
            Officer Management
          </h1>

          <p className="text-slate-400 text-sm">
            Manage officer access and assignments
          </p>

        </div>

      </div>


      {/* TABLE */}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">


        {/* SEARCH */}

        <div className="flex justify-between px-6 py-4 border-b border-slate-700">

          <div className="font-semibold">
            Registered Officers
          </div>

          <div className="flex gap-2">

            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search officer..."
              className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg"
            />

            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
            >
              Search
            </button>

          </div>

        </div>


        {/* TABLE CONTENT */}

        <table className="w-full">

          <thead className="bg-slate-900">

            <tr>

              <th className="px-6 py-3 text-left">Login ID</th>

              <th className="px-6 py-3 text-left">Officer Name</th>

              <th className="px-6 py-3 text-left">Status</th>

              <th className="px-6 py-3 text-left">Actions</th>

            </tr>

          </thead>


          <tbody>

            {loadingUsers && (

              <tr>
                <td colSpan="4" className="text-center py-6">
                  Loading officers...
                </td>
              </tr>

            )}


            {!loadingUsers && users.map(user => {

              const isSelf = user.id === adminId;
              const isActive = user.status === "active";

              return (

                <tr key={user.id} className="border-t border-slate-700">

                  <td className="px-6 py-3">{user.login_id}</td>

                  <td className="px-6 py-3 font-medium">

                    {user.full_name}

                    {isSelf &&
                      <span className="text-xs text-slate-400 ml-2">
                        (You)
                      </span>
                    }

                  </td>

                  <td className="px-6 py-3">
                    <StatusBadge status={user.status}/>
                  </td>

                  <td className="px-6 py-3 flex gap-2 flex-wrap">


                    {!isSelf && !isActive &&
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
                        <option>Head Constable</option>
                        <option>Sub-Inspector</option>
                        <option>Inspector</option>
                        <option>DSP</option>
                        <option>SP</option>
                      </select>
                    }


                    {!isSelf && stations.length > 0 &&
                      <select
                        onChange={(e) => assignStation(user.id, e.target.value)}
                        className="bg-slate-700 px-2 py-1 rounded"
                      >
                        <option value="">Station</option>

                        {stations.map(st => (

                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>

                        ))}

                      </select>
                    }

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>


        {/* PAGINATION */}

        <div className="flex justify-center gap-2 py-4 border-t border-slate-700">


          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="bg-slate-700 px-4 py-2 rounded"
          >
            Previous
          </button>


          {[...Array(totalPages)].map((_, i) => (

            <button
              key={i}
              onClick={() => setPage(i+1)}
              className={
                page === i+1
                ? "bg-blue-600 px-4 py-2 rounded"
                : "bg-slate-700 px-4 py-2 rounded"
              }
            >
              {i+1}
            </button>

          ))}


          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="bg-slate-700 px-4 py-2 rounded"
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

  if (status === "active")
    return <span className="text-green-400">Active</span>;

  if (status === "blocked")
    return <span className="text-red-400">Blocked</span>;

  return <span className="text-yellow-400">Pending</span>;

}