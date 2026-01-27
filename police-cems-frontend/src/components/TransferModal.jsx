import { useState } from "react";

export default function TransferModal({ evidence, onClose }) {
  const [toStation, setToStation] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const submitTransfer = async () => {
  if (
    !toStation.trim() ||
    !officerId.trim() ||
    !officerEmail.trim() ||
    !remarks.trim()
  ) {
    alert("All required fields must be filled");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("http://localhost:5000/api/transfers/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        evidenceId: evidence.id,
        toStation: toStation.trim(),
        toOfficerId: officerId.trim(),        // ✅ FIXED
        toOfficerEmail: officerEmail.trim(),  // ✅ FIXED
        reason: remarks.trim()                // ✅ FIXED
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    alert("Transfer completed successfully");
    onClose();
    window.location.reload();

  } catch (err) {
    alert(err.message || "Transfer failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-600 flex justify-between">
          <h3 className="text-white font-bold">New Transfer</h3>
          <button onClick={onClose} className="text-white">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-white">

          <div>
            <label className="text-sm">Evidence ID</label>
            <input
              disabled
              value={evidence.evidence_code}
              className="w-full bg-slate-800 p-2 rounded border"
            />
          </div>

          <div>
            <label className="text-sm">From Location</label>
            <input
              value={evidence.current_station || "Unknown"}
              className="w-full bg-slate-800 p-2 rounded border"
            />
          </div>

          <div>
            <label className="text-sm">To Location *</label>
            <input
              value={toStation}
              onChange={e => setToStation(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded border"
            />
          </div>

          <div>
            <label className="text-sm">Receiving Officer ID *</label>
            <input
              value={officerId}
              onChange={e => setOfficerId(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded border"
            />
          </div>

          <div>
            <label className="text-sm">Officer Email *</label>
            <input
              type="email"
              value={officerEmail}
              onChange={e => setOfficerEmail(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded border"
            />
          </div>

          <div>
            <label className="text-sm">Remarks/Reason</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded border"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-blue-600 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={submitTransfer}
            className="px-6 py-2 bg-blue-600 rounded"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>

      </div>
    </div>
  );
}
