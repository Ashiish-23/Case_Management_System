import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PendingTransfers() {
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:5000/api/transfers/pending", {
      headers: {
        Authorization: "Bearer " + token
      }
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load transfers");
        }
        return res.json();
      })
      .then(data => {
        setTransfers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Unable to load pending transfers");
        setLoading(false);
      });
  }, [navigate]);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="p-8 text-slate-400 animate-pulse">
        Loading pending transfers…
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */
  if (error) {
    return (
      <div className="p-8 text-rose-400">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 text-white">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">
          Pending Evidence Transfers
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Evidence awaiting your acknowledgment or review
        </p>
      </div>

      {/* EMPTY STATE */}
      {transfers.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-slate-400 italic">
          No pending transfers at this time.
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {transfers.map(t => (
          <div
            key={t.transfer_id}
            onClick={() =>
              navigate(`/cases/${t.case_id}`)
            }
            className="
              bg-slate-800 border border-slate-700 rounded-xl p-5
              cursor-pointer transition-all
              hover:bg-slate-700/40 hover:border-slate-600
            "
          >
            {/* Evidence */}
            <div className="font-mono text-blue-400 text-lg mb-1">
              {t.evidence_code}
            </div>

            {/* Case */}
            <div className="text-slate-300 text-sm">
              Case: <span className="font-semibold">{t.case_number}</span>
            </div>

            {/* Title */}
            <div className="text-slate-400 text-sm">
              {t.case_title}
            </div>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Transfer Type: {t.transfer_type}</span>
              <span>
                Initiated: {new Date(t.created_at).toLocaleString()}
              </span>
            </div>

            {/* CTA */}
            <div className="mt-4 text-sm text-blue-400">
              View case → manage evidence
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
