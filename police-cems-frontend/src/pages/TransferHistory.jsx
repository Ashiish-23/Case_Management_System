import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";

export default function TransferHistory() {
  const { evidenceId } = useParams();
  const navigate = useNavigate();

  const [caseId, setCaseId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!evidenceId) return;

    fetch(`http://localhost:5000/api/transfers/history/${evidenceId}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          setHistory([]);
          setCaseId(null);
          return;
        }

        setHistory(data);
        setCaseId(data[0].case_id); // ✅ SINGLE SOURCE OF TRUTH
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load transfer history");
      })
      .finally(() => setLoading(false));
  }, [evidenceId, token]);

  return (
    <div className="min-h-screen bg-blue-900">
      <Topbar />

      <div className="max-w-[95rem] mx-auto px-6 py-8 pb-10 text-white">
        {/* BACK BUTTON */}
        <button
          disabled={!caseId}
          onClick={() => navigate(`/case/${caseId}`)}
          className="group flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors disabled:opacity-40"
        >
          <span className="transition-transform group-hover:-translate-x-1">⬅</span>
          Back to Case Details
        </button>

        <h1 className="text-2xl font-bold mb-1">Transfer History</h1>
        <p className="text-sm text-blue-200 mb-6">
          Complete chain of custody for this evidence
        </p>

        <div className="bg-blue-800/70 border border-blue-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-blue-200">
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-blue-200">
              No transfer records found
            </div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <thead className="bg-slate-900/70">
              <tr>
                <th className="px-6 py-4 text-left">From Station</th>
                <th className="px-6 py-4 text-left">To Station</th>

                <th className="px-6 py-4 text-left">From Officer</th>
                <th className="px-6 py-4 text-left">To Officer</th>

                <th className="px-6 py-4 text-left">Remarks</th>
                <th className="px-6 py-4 text-left">Transferred By</th>
                <th className="px-6 py-4 text-left">Date</th>
              </tr>
              </thead>
              
                <tbody>
  {history.map((h, i) => (
    <tr
      key={h.id}
      className={`border-t border-blue-700 ${
        i % 2 === 0 ? "bg-blue-800/60" : "bg-blue-800/40"
      }`}
    >
      <td className="px-6 py-4">{h.from_station}</td>
      <td className="px-6 py-4">{h.to_station}</td>

      <td className="px-6 py-4 font-medium">
        {h.from_officer || "—"}
      </td>

      <td className="px-6 py-4 font-medium">
        {h.to_officer || "External"}
      </td>

      <td className="px-6 py-4 text-blue-100 min-w-[20rem]">
        {h.remarks || "-"}
      </td>

      <td className="px-6 py-4 font-semibold text-blue-100">
        {h.transferred_by}
      </td>

      <td className="px-6 py-4 text-blue-200">
        {new Date(h.created_at).toLocaleString()}
      </td>
    </tr>
  ))}
</tbody>


            </table>
          )}
        </div>
      </div>
    </div>
  );
}
