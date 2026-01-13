import { useState } from "react";
// import "../styles/modal.css"; // Deleted

export default function CaseStatusModal({ caseId, currentStatus, onClose }) {

  const [reason, setReason] = useState("");
  const [ref, setRef] = useState("");

  const token = localStorage.getItem("token");

  /* ---- CLOSE ---- */
  const closeCase = async () => {
    const res = await fetch("http://localhost:5000/api/cases/close", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        caseId,
        reason,
        authority_reference: ref
      })
    });

    if (res.ok) {
      onClose();
      window.location.reload();
    }
  };

  /* ---- RE-OPEN ---- */
  const reopenCase = async () => {
    const res = await fetch(`http://localhost:5000/api/cases/${caseId}/reopen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      onClose();
      window.location.reload();
    } else {
      alert(data.error || "Re-open failed");
    }
  };

  // Helper styles
  const inputStyle = "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const labelStyle = "block text-xs font-medium text-white mb-1 uppercase tracking-wider";

  // Determine header color based on status
  const isClosing = currentStatus === "OPEN" || currentStatus === "REOPENED";
  const headerColor = isClosing ? "text-red-400" : "text-emerald-400";
  const borderColor = isClosing ? "border-red-500/30" : "border-emerald-500/30";

  return (
    // Overlay
    <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">

      {/* Modal Card */}
      <div className={`bg-blue-800 border ${borderColor} rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-[fadeIn_0.2s_ease-out]`}>

        {/* Header */}
        <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Update Status: <span className={headerColor}>{currentStatus}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">

          {/* ----- CLOSURE UI ----- */}
          {isClosing && (
            <>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm flex items-center gap-2 mb-2">
                <span>⚠️</span> This action will lock the evidence chain.
              </div>

              <div>
                <label className={labelStyle}>Reason for Closure</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className={`${inputStyle} h-24 resize-none`}
                  placeholder="Why is this case being closed?"
                />
              </div>

              <div>
                <label className={labelStyle}>Authority Reference</label>
                <input
                  value={ref}
                  onChange={e => setRef(e.target.value)}
                  className={inputStyle}
                  placeholder="e.g. Court Order #1234 or SP Approval"
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-white hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-red-900/50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={!reason || !ref}
                  onClick={closeCase}
                >
                  Close Case
                </button>
              </div>
            </>
          )}

          {/* ----- RE-OPEN UI ----- */}
          {currentStatus === "CLOSED" && (
            <>
              <div className="p-3 bg-blue-500/10 border border-emerald-500/20 rounded-lg text-emerald-200 text-sm flex items-center gap-2 mb-2">
                <span>🔓</span> This will reactivate evidence logging.
              </div>

              <div>
                <label className={labelStyle}>Reason for Re-Opening</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className={`${inputStyle} h-32 resize-none`}
                  placeholder="New evidence found? Court order?"
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-white hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-emerald-900/50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={!reason}
                  onClick={reopenCase}
                >
                  Re-Open Case
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}