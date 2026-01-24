import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TransferHistory from "../components/TransferHistory";

export default function Transfers() {
  const [items, setItems] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/custody", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(setItems);
  }, []);

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Stock / Transfers</h1>

      <table className="w-full bg-slate-900 rounded-xl overflow-hidden">
        <thead className="bg-slate-800">
          <tr>
            <th className="p-3 text-left">Evidence</th>
            <th className="p-3">Current Station</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.evidence_id} className="border-t border-slate-700">
              <td className="p-3">{row.evidence_code}</td>
              <td className="p-3">{row.current_station}</td>
              <td className="p-3">{row.custody_status}</td>
              <td className="p-3 flex gap-3">
                <button
                  onClick={() => navigate(`/transfers/new/${row.evidence_id}`)}
                  className="px-3 py-1 bg-blue-600 rounded"
                >
                  New Transfer
                </button>
                <button
                  onClick={() => setSelectedEvidence(row.evidence_id)}
                  className="px-3 py-1 bg-slate-600 rounded"
                >
                  History
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEvidence && (
        <TransferHistory
          evidenceId={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </div>
  );
}
