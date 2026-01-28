import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TransferHistory() {
  const { evidenceId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`http://localhost:5000/api/transfers/history/${evidenceId}`, {
      headers: {
        Authorization: "Bearer " + token
      }
    })
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => {
        alert("Failed to load transfer history");
        setLoading(false);
      });
  }, [evidenceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 text-white flex items-center justify-center">
        Loading transfer history...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transfer History</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-700 rounded"
          >
            Back
          </button>
        </div>

        {/* Table */}
        <div className="bg-blue-800 border border-blue-600 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-900">
              <tr>
                <th className="p-3 text-left">From Station</th>
                <th className="p-3 text-left">To Station</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Remarks</th>
                <th className="p-3 text-left">Transferred By</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-300">
                    No transfer history available
                  </td>
                </tr>
              )}

              {history.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-blue-700 hover:bg-blue-700/40"
                >
                  <td className="p-3">{t.from_station}</td>
                  <td className="p-3">{t.to_station}</td>
                  <td className="p-3 font-mono">{t.transfer_type}</td>
                  <td className="p-3">{t.remarks}</td>
                  <td className="p-3">{t.transferred_by}</td>
                  <td className="p-3">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
