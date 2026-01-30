import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function TransferHistory() {
  const { evidenceId } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!evidenceId) {
      console.error("❌ evidenceId missing");
      return;
    }

    console.log("PARAM evidenceId:", evidenceId);

    fetch(`http://localhost:5000/api/transfers/history/${evidenceId}`, {
      headers: {
        Authorization: "Bearer " + token
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid history response");
        }
        setHistory(data);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load transfer history");
      })
      .finally(() => setLoading(false));
  }, [evidenceId, token]);

  if (!evidenceId) {
    return <div className="p-6 text-red-400">Invalid Evidence</div>;
  }

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-4">Transfer History</h2>

      {history.length === 0 ? (
        <p>No transfers recorded</p>
      ) : (
        <table className="w-full border border-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-2">From</th>
              <th className="p-2">To</th>
              <th className="p-2">Type</th>
              <th className="p-2">Remarks</th>
              <th className="p-2">By</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} className="border-t border-slate-700">
                <td className="p-2">{h.from_station}</td>
                <td className="p-2">{h.to_station}</td>
                <td className="p-2">{h.transfer_type}</td>
                <td className="p-2">{h.remarks}</td>
                <td className="p-2">{h.transferred_by}</td>
                <td className="p-2">
                  {new Date(h.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
