import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PendingTransfers() {
  const [transfers, setTransfers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const loadTransfers = () => {
    fetch("http://localhost:5000/api/transfers/pending", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(setTransfers)
      .catch(console.error);
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const act = async (id, action) => {
    const reason =
      action === "reject"
        ? prompt("Enter rejection reason")
        : null;

    if (action === "reject" && !reason) return;

    await fetch(`http://localhost:5000/api/transfers/${id}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: action === "reject"
        ? JSON.stringify({ rejectionReason: reason })
        : null
    });

    loadTransfers();
  };

  return (
    <div className="p-8 text-white bg-blue-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Pending Evidence Transfers</h2>

      {transfers.length === 0 ? (
        <p className="text-slate-400">No pending transfers.</p>
      ) : (
        <div className="space-y-4">
          {transfers.map(t => (
            <div
              key={t.transfer_id}
              className="bg-blue-800 border border-slate-700 rounded-lg p-4"
            >
              <div
                className="font-mono text-white-400 cursor-pointer"
                onClick={() => navigate(`/cases/${t.case_id}`)}
              >
                {t.evidence_code}
              </div>

              <div className="text-white-300 text-sm">
                Case: {t.case_number} — {t.case_title}
              </div>

              <div className="text-white-400 text-sm">
                From: {t.from_station}
              </div>

              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => act(t.transfer_id, "accept")}
                  className="bg-blue-600 hover:bg-emerald-500 px-4 py-2 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => act(t.transfer_id, "reject")}
                  className="bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
