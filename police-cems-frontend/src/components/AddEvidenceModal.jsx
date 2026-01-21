import { useState } from "react";

export default function AddEvidenceModal({ caseId, onClose }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [originStation, setOriginStation] = useState("");
  const [originLocation, setOriginLocation] = useState("");
  const [seizureContext, setSeizureContext] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const submitEvidence = async () => {
    if (
      !description.trim() ||
      !category.trim() ||
      !originStation.trim() ||
      !originLocation.trim() ||
      !seizureContext.trim()
    ) {
      alert("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/evidence/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          caseId,
          description: description.trim(),
          category: category.trim(),
          originStation: originStation.trim(),
          originLocation: originLocation.trim(),
          seizureContext: seizureContext.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add evidence");

      alert("Evidence added successfully");
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
            Add New Evidence
          </h3>
          <button onClick={onClose} className="text-white text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          <div>
            <label className="text-sm font-semibold text-slate-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              placeholder="Detailed description of the evidence..." required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-300">
              Category
            </label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              placeholder="Weapon / Narcotics / Digital Asset etc." required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-300">
              Seized At Station
            </label>
            <input
              value={originStation}
              onChange={e => setOriginStation(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              placeholder="Police station name" required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-300">
              Initial Evidence Location
            </label>
            <input
              value={originLocation}
              onChange={e => setOriginLocation(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              placeholder="Evidence room / locker / shelf" required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-300">
              Seizure Context / Authority
            </label>
            <textarea
              value={seizureContext}
              onChange={e => setSeizureContext(e.target.value)}
              rows={3}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              placeholder="Recovered during investigation / produced by complainant etc." required
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
            onClick={submitEvidence}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Evidence"}
          </button>
        </div>

      </div>
    </div>
  );
}
