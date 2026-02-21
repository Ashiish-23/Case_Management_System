import {
  useEffect,
  useState,
  useCallback
} from "react";

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
    throw new Error(data.error || `Server error (${res.status})`);

  return data;
}


/* ================= SECURITY HELPERS ================= */

function safeText(v, max = 200) {

  if (typeof v !== "string")
    return "";

  return v.replace(/[<>]/g, "").slice(0, max);

}


function safeId(v) {

  if (!v)
    return "";

  return String(v)
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 64);

}


/* ================= COMPONENT ================= */

export default function AdminTransfers() {

  const [transfers, setTransfers] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  /* ================= LOAD TRANSFERS ================= */

  const loadTransfers = useCallback(async () => {

    try {

      setLoading(true);
      setError(null);

      const result = await secureFetch(
        `http://localhost:5000/api/admin/transfers?page=${page}&limit=15&search=${encodeURIComponent(search)}`
      );

      setTransfers(result.data || []);
      setTotalPages(result.totalPages || 1);

    }
    catch (err) {

      console.error("Transfers fetch error:", err);
      setError(err.message);

    }
    finally {

      setLoading(false);

    }

  }, [page, search]);


  useEffect(() => {

    loadTransfers();

  }, [loadTransfers]);


  /* ================= SEARCH ================= */

  function handleSearch(e) {

    e.preventDefault();

    const trimmed = searchInput.trim();

    setPage(1);
    setSearch(trimmed);

  }


  /* ================= PAGINATION ================= */

  function goToPage(p) {

    if (p < 1 || p > totalPages)
      return;

    setPage(p);

  }


  /* ================= UI ================= */

  return (

    <div className="pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">


      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-2xl font-semibold text-white">
            Transfer Audit Ledger
          </h1>

          <p className="text-slate-400 text-sm">
            Complete chain of custody across all stations and officers
          </p>

        </div>

      </div>



      {/* TABLE CONTAINER */}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">


        {/* HEADER BAR */}

        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700">

          <div className="font-semibold text-white">
            Evidence Transfers
          </div>


          <form onSubmit={handleSearch} className="flex gap-2">

            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search evidence code, case, station, officer..."
              className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white w-72 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white text-sm"
            >
              Search
            </button>

          </form>

        </div>



        {/* TABLE */}

        <table className="w-full">

          <thead className="bg-slate-900">

            <tr>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Evidence Code
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Case Number
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                From Station
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                To Station
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Transferred By
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Date
              </th>

            </tr>

          </thead>


          <tbody>


            {loading && (

              <tr>

                <td colSpan="6" className="text-center py-6 text-slate-400">
                  Loading transfers...
                </td>

              </tr>

            )}


            {error && (

              <tr>

                <td colSpan="6" className="text-center py-6 text-red-400">
                  {error}
                </td>

              </tr>

            )}


            {!loading && !error && transfers.length === 0 && (

              <tr>

                <td colSpan="6" className="text-center py-6 text-slate-400">
                  No transfers found
                </td>

              </tr>

            )}


            {!loading && !error && transfers.map(t => (

              <tr
                key={safeId(t.id)}
                className="border-t border-slate-700 hover:bg-slate-700/40 transition"
              >

                <td className="px-6 py-3 font-mono text-sm text-white">
                  {safeText(t.evidence_code, 80)}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(t.case_number, 80) || "—"}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(t.from_station, 120) || "—"}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(t.to_station, 120) || "—"}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(t.transferred_by, 120) || "—"}
                </td>

                <td className="px-6 py-3 text-slate-300 text-sm">
                  {t.transferred_at
                    ? new Date(t.transferred_at).toLocaleString()
                    : "—"}
                </td>

              </tr>

            ))}


          </tbody>

        </table>



        {/* PAGINATION */}

        <div className="flex justify-center gap-2 py-4 border-t border-slate-700">

          <button
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-4 py-2 rounded-lg text-white"
          >
            Previous
          </button>


          {[...Array(totalPages)].map((_, i) => {

            const p = i + 1;

            return (

              <button
                key={p}
                onClick={() => goToPage(p)}
                className={
                  page === p
                    ? "bg-blue-600 px-4 py-2 rounded-lg text-white"
                    : "bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white"
                }
              >
                {p}
              </button>

            );

          })}


          <button
            disabled={page === totalPages}
            onClick={() => goToPage(page + 1)}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-4 py-2 rounded-lg text-white"
          >
            Next
          </button>

        </div>


      </div>

    </div>

  );

}