import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TransferModal from "./TransferModal";

export default function EvidenceActionModal({ data, close }) {
  const [showTransfer, setShowTransfer] = useState(false);
  const navigate = useNavigate();

  if (!data) return null;

  const openHistory = () => {
    close(); // close action modal first
    navigate(`/transfers/history/${data.id}`);
  };

  return (
    <>
      {/* ACTION MODAL */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Header */}
          <div className="bg-blue-900/50 px-4 py-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Evidence Actions</h3>
            <button onClick={close} className="text-white text-lg">✕</button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 mb-6">
              <p className="text-xs uppercase text-slate-400 mb-1">
                Evidence ID
              </p>
              <p className="font-mono text-blue-400 text-lg mb-3">
                {data.evidence_code}
              </p>

              <p className="text-xs uppercase text-slate-400 mb-1">
                Description
              </p>
              <p className="text-white text-sm">
                {data.description}
              </p>
            </div>

            <div className="space-y-3">
              {/* NEW TRANSFER */}
              <button
                onClick={() => setShowTransfer(true)}
                className="w-full bg-blue-700 py-3 rounded-lg text-white hover:bg-blue-600 transition"
              >
                🚚 New Transfer
              </button>

              {/* VIEW HISTORY */}
              <button
                onClick={openHistory}
                className="w-full bg-slate-800 border border-slate-700 py-3 rounded-lg text-white hover:bg-slate-700 transition"
              >
                📜 View Transfer History
              </button>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={close}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSFER MODAL */}
      {showTransfer && (
        <TransferModal
          evidence={data}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </>
  );
}
