// Transfers page: list custody items and open transfer/history flows.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TransferHistory from "./TransferHistory";

export default function Transfers() {
  const [items, setItems] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/custody", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(setItems);
  }, [ token ]);

  return (
    <div className="p-8 bg-blue-950 text-white">
      <h1 className="text-2xl font-bold mb-6 text-white">Transfers</h1>

      <table className="w-full bg-blue-900 rounded-xl">
        <thead className="bg-blue-800">
          <tr>
            <th className="p-3 text-left text-white">Evidence</th>
            <th className="p-3 text-white">Current Station</th>
            <th className="p-3 text-white">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.evidence_id} className="border-t bg-blue-850 border-blue-700 hover:bg-blue-800">
              <td className="p-3 text-blue-50">{row.evidence_code}</td>
              <td className="p-3 text-blue-50">{row.current_station}</td>
              <td className="p-3 flex gap-3">
                <button
                  onClick={() => navigate(`/transfers/new/${row.evidence_id}`)}
                  className="px-3 py-1 bg-slate-500 hover:bg-blue-400 rounded text-white font-semibold"
                >New Transfer</button>
                <button
                  onClick={() => setSelectedEvidence(row.evidence_id)}
                  className="px-3 py-1 bg-slate-500 hover:bg-blue-400 rounded text-white font-semibold"
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
