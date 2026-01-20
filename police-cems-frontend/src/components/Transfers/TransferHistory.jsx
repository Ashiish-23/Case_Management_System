import { useEffect, useState } from "react";

export default function TransferHistory({ caseId, evidenceId, refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (caseId) params.append("caseId", caseId);
        if (evidenceId) params.append("evidenceId", evidenceId);

        const res = await fetch(
          `http://localhost:5000/api/transfers/history?${params.toString()}`,
          {
            headers: {
              Authorization: "Bearer " + token
            }
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load history");

        setHistory(data);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [caseId, evidenceId, refreshKey]);

  if (loading) {
    return (
      <div className="text-slate-400 text-sm">
        Loading transfer history…
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-slate-400 text-sm">
        No transfer history found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((t) => (
        <div
          key={t.id}
          className="relative bg-slate-900 border border-slate-700 rounded-lg p-4"
        >
          {/* Timeline Dot */}
          <div className="absolute -left-2 top-5 w-3 h-3 bg-blue-500 rounded-full" />

          <div className="flex justify-between">
            <div>
              <div className="font-mono text-blue-400 text-sm">
                {t.evidence_code}
              </div>

              <div className="text-xs text-slate-300 mt-1">
                {t.transfer_type.replaceAll("_", " ")}
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Status:{" "}
                <span className="font-semibold">
                  {t.status}
                </span>
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Reason: {t.reason}
              </div>
            </div>

            <div className="text-right text-xs text-slate-400">
              <div>
                {new Date(t.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
