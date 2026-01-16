import { useState, useEffect } from "react";

export default function TransferInitiateModal({ evidence, caseId, onClose }) {
  const [transferType, setTransferType] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [toStation, setToStation] = useState("");
  const [toExternalEntity, setToExternalEntity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Reset irrelevant fields when transfer type changes
  useEffect(() => {
    setToUserId("");
    setToStation("");
    setToExternalEntity("");
  }, [transferType]);

  const submitTransfer = async () => {
  if (!transferType || !reason) {
    alert("Transfer type and reason are required");
    return;
  }

  if (transferType === "EXTERNAL_OUT" && !toExternalEntity) {
    alert("External entity is required");
    return;
  }

  if (transferType === "PERSON_TO_PERSON" && !toUserId) {
    alert("Receiving officer is required");
    return;
  }

  if (
    (transferType === "PERSON_TO_STORAGE" ||
     transferType === "STORAGE_TO_PERSON") &&
    !toStation
  ) {
    alert("Station / storage location is required");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("http://localhost:5000/api/transfers/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        evidenceId: evidence.id,
        caseId,
        transferType,
        toUserId: transferType === "PERSON_TO_PERSON" ? toUserId : null,
        toStation:
          transferType === "PERSON_TO_STORAGE" ||
          transferType === "STORAGE_TO_PERSON"
            ? toStation
            : null,
        toExternalEntity:
          transferType === "EXTERNAL_OUT" ? toExternalEntity : null,
        reason
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    alert("Transfer initiated successfully");
    onClose();
    window.location.reload();

  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-blue-900/60 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">
            Initiate Evidence Transfer
          </h3>
          <button onClick={onClose} className="text-white text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Evidence */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-xs uppercase text-slate-400 mb-1">
              Evidence ID
            </div>
            <div className="font-mono text-blue-400 text-lg">
              {evidence.evidence_code}
            </div>
          </div>

          {/* Transfer Type */}
          <div>
            <label className="text-sm font-semibold text-slate-300">
              Transfer Type
            </label>
            <select
              value={transferType}
              onChange={e => setTransferType(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="">Select transfer type</option>
              <option value="PERSON_TO_PERSON">Officer → Officer</option>
              <option value="PERSON_TO_STORAGE">Officer → Storage</option>
              <option value="STORAGE_TO_PERSON">Storage → Officer</option>
              <option value="EXTERNAL_OUT">External (Court / Lab)</option>
            </select>
          </div>

          {transferType === "PERSON_TO_PERSON" && (
            <div>
              <label className="text-sm font-semibold text-slate-300">
                Receiving Officer ID
              </label>
              <input
                value={toUserId}
                onChange={e => setToUserId(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          )}

          {(transferType === "PERSON_TO_STORAGE" ||
            transferType === "STORAGE_TO_PERSON") && (
            <div>
              <label className="text-sm font-semibold text-slate-300">
                Station / Storage Location
              </label>
              <input
                value={toStation}
                onChange={e => setToStation(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          )}

          {transferType === "EXTERNAL_OUT" && (
            <div>
              <label className="text-sm font-semibold text-slate-300">
                External Entity
              </label>
              <input
                value={toExternalEntity}
                onChange={e => setToExternalEntity(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-300">
              Reason for Transfer
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white"
          >
            Cancel
          </button>

          <button
            onClick={submitTransfer}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Initiate Transfer"}
          </button>
        </div>

      </div>
    </div>
  );
}
