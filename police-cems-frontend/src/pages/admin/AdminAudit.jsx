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

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [page]);

  async function loadLogs() {
    setLoading(true);
    try {
      const result =
        await secureFetch(
          `http://localhost:5000/api/admin/audit?page=${page}&limit=20`
        );
      setLogs(result.data);
      setTotalPages(result.totalPages);
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  }
  function goToPage(p) {
    if (p < 1 || p > totalPages)
      return;

    setPage(p);
  }

  if (loading)
    return <div className="text-white">Loading audit logs...</div>;

  return (
    <div className="text-white">
      <table className="w-full bg-slate-800 rounded">
        <thead className="bg-slate-900">
          <tr>
            <th className="p-3 text-left">Time</th>
            <th className="p-3 text-left">Actor</th>
            <th className="p-3 text-left">Action</th>
            <th className="p-3 text-left">Target</th>
            <th className="p-3 text-left">Details</th>
          </tr>
        </thead>
        
        <tbody>
          {logs.map(log => (
            <tr key={log.id}
                className="border-t border-slate-700">

              <td className="p-3">
                {new Date(log.created_at).toLocaleString()}
              </td>

              <td className="p-3">
                {log.actor_name}
              </td>

              <td className="p-3 font-mono">
                {log.action_type}
              </td>

              <td className="p-3">
                {log.target_type}
              </td>

              <td className="p-3 text-xs">
                {JSON.stringify(log.details)}
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
  );
}
