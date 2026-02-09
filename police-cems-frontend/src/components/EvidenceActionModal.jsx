import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TransferModal from "./TransferModal";

/* ================= SECURITY HELPERS ================= */

function safeText(v, max = 200) {
  if (typeof v !== "string") return "";
  return v.replace(/[<>]/g, "").slice(0, max);
}

function safeId(v) {
  if (!v) return "";
  return String(v).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
}

/* ================= COMPONENT ================= */

export default function EvidenceActionModal({ data, close }) {

  const navigate = useNavigate();
  const [showTransfer, setShowTransfer] = useState(false);
  const [busy, setBusy] = useState(false);

  /* ---------- SAFE DERIVED VALUES ---------- */
  const safeEvidence = useMemo(() => ({
    id: safeId(data?.id),
    code: safeText(data?.evidence_code, 80),
    description: safeText(data?.description, 500)
  }), [data]);

  /* ---------- HARD GUARD ---------- */
  if (!data || typeof data !== "object") return null;

  /* ---------- SAFE NAVIGATION ---------- */
  const openHistory = () => {

    if (busy) return;
    if (!safeEvidence.id) return;

    setBusy(true);

    try {
      close?.();
      navigate(`/transfers/history/${safeEvidence.id}`);
    } finally {
      setTimeout(() => setBusy(false), 800);
    }
  };

  /* ---------- SAFE TRANSFER OPEN ---------- */
  const openTransfer = () => {
    if (busy) return;
    setBusy(true);
    setShowTransfer(true);
    setTimeout(() => setBusy(false), 500);
  };

  /* ================= UI ================= */

  return (
    <>
      {/* ACTION MODAL */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

        <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Header */}
          <div className="bg-blue-900/50 px-4 py-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Evidence Actions
            </h3>

            <button
              onClick={close}
              disabled={busy}
              className="text-white text-lg disabled:opacity-50"
              aria-label="Close evidence actions modal"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6">

            {/* Evidence Summary */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 mb-6">

              <p className="text-xs uppercase text-slate-400 mb-1">
                Evidence Code
              </p>

              <p className="font-mono text-blue-400 text-lg mb-3 break-all">
                {safeEvidence.code || "Unknown"}
              </p>

              <p className="text-xs uppercase text-slate-400 mb-1">
                Description
              </p>

              <p className="text-white text-sm whitespace-pre-wrap break-words">
                {safeEvidence.description || "No description"}
              </p>

            </div>

            {/* Actions */}
            <div className="space-y-3">

              {/* NEW TRANSFER */}
              <button
                onClick={openTransfer}
                disabled={busy}
                className="w-full bg-blue-700 py-3 rounded-lg text-white hover:bg-blue-600 transition disabled:opacity-50"
              >
                🚚 New Transfer
              </button>

              {/* VIEW HISTORY */}
              <button
                onClick={openHistory}
                disabled={busy}
                className="w-full bg-slate-800 border border-slate-700 py-3 rounded-lg text-white hover:bg-slate-700 transition disabled:opacity-50"
              >
                📜 View Transfer History
              </button>

            </div>

            {/* Footer */}
            <div className="mt-6 text-right">
              <button
                onClick={close}
                disabled={busy}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-50"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* TRANSFER MODAL */}
      {showTransfer && safeEvidence.id && (
        <TransferModal
          evidence={data}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </>
  );
}
