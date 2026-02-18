import { useEffect, useState } from "react";

async function secureFetch(url) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (!res.ok)
    throw new Error("Fetch failed");
  return res.json();
}

export default function AdminTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransfers();
  }, [page, search]);

  async function loadTransfers() {
    setLoading(true);
    try {
      const result =
        await secureFetch(
          `http://localhost:5000/api/admin/transfers?page=${page}&limit=15&search=${search}`
        );
      setTransfers(result.data);
      setTotalPages(result.totalPages);
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  }

  if (loading)
    return <div className="text-white">Loading transfers...</div>;

  return (
    <div className="text-white">

      {/* SEARCH */}
      <input
        value={search}
        onChange={e => {
          setPage(1);
          setSearch(e.target.value);
        }}
        placeholder="Search evidence, case, station..."
        className="mb-4 px-4 py-2 bg-slate-800 rounded"/>

      {/* TABLE */}
      <table className="w-full bg-slate-800 rounded">
        <thead className="bg-slate-900">
          <tr>
            <th className="p-3 text-left">Evidence</th>
            <th className="p-3 text-left">Case</th>
            <th className="p-3 text-left">From</th>
            <th className="p-3 text-left">To</th>
            <th className="p-3 text-left">Officer</th>
            <th className="p-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map(t => (
            <tr key={t.id}
                className="border-t border-slate-700">

              <td className="p-3 font-mono">
                {t.evidence_code}
              </td>

              <td className="p-3">
                {t.case_number}
              </td>

              <td className="p-3">
                {t.from_station}
              </td>

              <td className="p-3">
                {t.to_station}
              </td>

              <td className="p-3">
                {t.transferred_by}
              </td>

              <td className="p-3">
                {new Date(t.transferred_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className="flex gap-3 mt-4">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}> Prev </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)} > Next </button>
      </div>
    </div>
  );
}
