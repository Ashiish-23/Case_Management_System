import { useEffect, useState, useCallback } from "react";

/* ================= SECURE FETCH ================= */

async function secureFetch(url) {

  const token = sessionStorage.getItem("token");

  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok)
    throw new Error(data.error || "Fetch failed");

  return data;

}


/* ================= COMPONENT ================= */

export default function AdminCases() {

  const [cases, setCases] = useState([]);

  const [inputValue, setInputValue] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState(""); // THIS is the actual API search value

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  /* ================= FIXED SEARCH SUBMIT ================= */

  function handleSubmit(e) {

    e.preventDefault();

    const trimmed = inputValue.trim();

    setPage(1); // reset pagination

    if (trimmed.length === 0) {

      setSearch("");
      return;

    }

    if (trimmed.length < 2)
      return;

    setSearch(trimmed);

  }


  /* ================= LOAD CASES ================= */

  const loadCases = useCallback(async () => {

    try {

      setLoading(true);

      const result =
        await secureFetch(
          `http://localhost:5000/api/admin/cases?page=${page}&limit=15&search=${encodeURIComponent(search)}`
        );

      setCases(result.data || []);
      setTotalPages(result.totalPages || 1);

      setError(null);

    }
    catch (err) {

      console.error(err);

      setError("Failed to load cases");

    }
    finally {

      setLoading(false);

    }

  }, [page, search]);


  useEffect(() => {

    loadCases();

  }, [loadCases]);


  /* ================= UI ================= */

  return (

    <div className="pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">


      {/* ================= HEADER ================= */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-2xl font-semibold">
            Case Management
          </h1>

          <p className="text-slate-400 text-sm">
            View and manage all registered cases
          </p>

        </div>

      </div>



      {/* ================= TABLE CONTAINER ================= */}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">


        {/* ================= TABLE HEADER BAR ================= */}

        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700">


          <div className="font-semibold">
            Registered Cases
          </div>


          <div className="flex gap-2">

            <form
              onSubmit={handleSubmit}
              className="flex items-center"
            >

              <input
                type="text"
                placeholder="Search case number, title, category..."
                value={inputValue}
                onChange={(e) =>
                  setInputValue(e.target.value)
                }
                className="bg-slate-800 border border-slate-600 px-4 py-2 rounded-lg text-sm text-white w-72 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-blue-600 rounded-lg text-sm text-white hover:bg-blue-700"
              >
                Search
              </button>

            </form>

          </div>

        </div>



        {/* ================= TABLE ================= */}

        <table className="w-full">


          <thead className="bg-slate-900">

            <tr>

              <th className="px-6 py-3 text-left text-sm">
                Case Number
              </th>

              <th className="px-6 py-3 text-left text-sm">
                Title
              </th>

              <th className="px-6 py-3 text-left text-sm">
                Station
              </th>

              <th className="px-6 py-3 text-left text-sm">
                Officer
              </th>

              <th className="px-6 py-3 text-left text-sm">
                Evidence
              </th>

              <th className="px-6 py-3 text-left text-sm">
                Date
              </th>

            </tr>

          </thead>


          <tbody>


            {loading && (

              <tr>

                <td
                  colSpan="6"
                  className="text-center py-6 text-slate-400"
                >

                  Loading cases...

                </td>

              </tr>

            )}


            {error && (

              <tr>

                <td
                  colSpan="6"
                  className="text-center py-6 text-red-400"
                >

                  {error}

                </td>

              </tr>

            )}


            {!loading && !error && cases.map(c => (

              <tr
                key={c.id}
                className="border-t border-slate-700 hover:bg-slate-700/40 transition"
              >

                <td className="px-6 py-3 font-mono text-sm">
                  {c.case_number}
                </td>

                <td className="px-6 py-3">
                  {c.case_title}
                </td>

                <td className="px-6 py-3">
                  {c.station_name}
                </td>

                <td className="px-6 py-3">
                  {c.officer_name}
                </td>

                <td className="px-6 py-3">
                  {c.evidence_count}
                </td>

                <td className="px-6 py-3 text-sm text-slate-300">
                  {new Date(c.registered_date).toLocaleDateString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>



        {/* ================= PAGINATION ================= */}

        <div className="flex justify-center gap-2 py-4 border-t border-slate-700">


          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Previous
          </button>


          {[...Array(totalPages)].map((_, i) => (

            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={
                page === i + 1
                  ? "bg-blue-600 px-4 py-2 rounded-lg"
                  : "bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
              }
            >
              {i + 1}
            </button>

          ))}


          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Next
          </button>


        </div>


      </div>


    </div>

  );

}