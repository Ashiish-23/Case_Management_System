import { useEffect, useState } from "react";

export default function TransferHistory({ evidenceId, onClose }) {
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`http://localhost:5000/api/transfers/history/${evidenceId}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(setHistory);
  }, [evidenceId]);

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-slate-900 w-full max-w-3xl p-6 rounded-xl text-white">
        <h2 className="text-lg font-bold mb-4">Transfer History</h2>

        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-2">From</th>
              <th className="p-2">To</th>
              <th className="p-2">Date</th>
              <th className="p-2">Officer</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} className="border-t border-slate-700">
                <td className="p-2">{h.from_station}</td>
                <td className="p-2">{h.to_station}</td>
                <td className="p-2">
                  {new Date(h.created_at).toLocaleString()}
                </td>
                <td className="p-2">{h.officer_name}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
