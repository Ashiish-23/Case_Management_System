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

      <div className="flex gap-4 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)} > Prev </button>

        <span>
          Page {page} / {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)} > Next </button>
      </div>
    </div>
  );
}
