import { useEffect, useState } from "react";

export default function PendingTransfers({ refreshKey, onActionComplete }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("token");

  const loadPendingTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/transfers/pending",
        {
          headers: {
            Authorization: "Bearer " + token
          }
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load transfers");

      setTransfers(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTransfers();
  }, [refreshKey]);

  const acceptTransfer = async (transferId) => {
    if (!window.confirm("Accept this evidence transfer?")) return;

    setProcessingId(transferId);

    try {
      const res = await fetch(
        `http://localhost:5000/api/transfers/${transferId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token
          }
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onActionComplete?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectTransfer = async (transferId) => {
    const rejectionReason = prompt("Enter reason for rejection:");
    if (!rejectionReason) return;

    setProcessingId(transferId);

    try {
      const res = await fetch(
        `http://localhost:5000/api/transfers/${transferId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          body: JSON.stringify({ rejectionReason })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onActionComplete?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-slate-400 text-sm">
        Loading pending transfers…
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="text-slate-400 text-sm">
        No pending transfers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transfers.map(t => (
        <div
          key={t.transfer_id}
          className="bg-blue-800/60 border border-slate-700 rounded-lg p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-mono text-blue-300 text-sm">
                {t.evidence_code}
              </div>

              <div className="text-xs text-slate-300 mt-1">
                Case: {t.case_number}
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Reason: {t.reason}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={processingId === t.transfer_id}
                onClick={() => acceptTransfer(t.transfer_id)}
                className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-sm disabled:opacity-50"
              >
                Accept
              </button>

              <button
                disabled={processingId === t.transfer_id}
                onClick={() => rejectTransfer(t.transfer_id)}
                className="bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded text-sm disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
