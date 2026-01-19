import { useState } from "react";
import TransferInitiateModal from "./TransferInitiateModal";

export default function EvidenceActionModal({ data, caseId, close, caseStatus }) {
  const [showTransfer, setShowTransfer] = useState(false);

  // ❗ Do NOT hard-block rendering
  if (!data) return null;

  return (
    <>
      {/* MAIN ACTION MODAL */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

          {/* Header */}
          <div className="bg-blue-900/50 px-6 py-4 border-b border-slate-700 flex justify-between">
            <h3 className="text-lg font-bold text-white">Evidence Actions</h3>
            <button onClick={close} className="text-white">✕</button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 mb-6">
              <p className="text-xs uppercase text-slate-400 mb-1">Evidence ID</p>
              <p className="font-mono text-blue-400 text-lg mb-3">
                {data.evidence_code}
              </p>

              <p className="text-xs uppercase text-slate-400 mb-1">Description</p>
              <p className="text-white text-sm">{data.description}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowTransfer(true)}
                disabled={caseStatus === "CLOSED" || caseStatus === "ARCHIVED"}
                className={`w-full py-3 rounded-lg border text-white ${
                  caseStatus === "CLOSED" || caseStatus === "ARCHIVED" ? "bg-slate-700 opacity-50 cursor-not-allowed" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                🚚 Transfer Evidence
              </button>


              <button
                disabled
                className="w-full bg-slate-800 border border-slate-700 py-3 rounded-lg text-white opacity-60 cursor-not-allowed"
              >
                📥 Receive Evidence (Coming Soon)
              </button>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={close}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSFER MODAL */}
      {showTransfer && (
        <TransferInitiateModal
          evidence={data}
          caseId={caseId}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </>
  );
}
