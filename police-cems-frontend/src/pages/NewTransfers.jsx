import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function NewTransfer() {
  const { evidenceId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState(null);
  const [toStation, setToStation] = useState("");
  const [remarks, setRemarks] = useState("");

  const token = localStorage.getItem("token");

  /* Load evidence + current station */
  useEffect(() => {
    fetch(`http://localhost:5000/api/custody/${evidenceId}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(setEvidence)
      .catch(() => alert("Failed to load custody data"));
  }, [evidenceId]);

  const submitTransfer = async () => {
    if (!toStation.trim()) {
      alert("To Location is required");
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
          evidenceId,
          toStation: toStation.trim(),
          remarks: remarks.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Transfer completed successfully");
      navigate("/transfers");

    } catch (err) {
      alert(err.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  if (!evidence) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">New Transfer</h1>

      <div className="grid grid-cols-2 gap-6 bg-slate-900 p-6 rounded-xl">

        <div>
          <label className="text-sm">Date</label>
          <input
            value={new Date().toISOString().slice(0, 10)}
            disabled
            className="w-full bg-slate-800 p-2 rounded"
          />
        </div>

        <div>
          <label className="text-sm">From Location</label>
          <input
            value={evidence.current_station}
            disabled
            className="w-full bg-slate-800 p-2 rounded"
          />
        </div>

        <div>
          <label className="text-sm">CR No</label>
          <input
            value={evidence.case_number}
            disabled
            className="w-full bg-slate-800 p-2 rounded"
          />
        </div>

        <div>
          <label className="text-sm">Evidence ID</label>
          <input
            value={evidence.evidence_code}
            disabled
            className="w-full bg-slate-800 p-2 rounded"
          />
        </div>

        <div>
          <label className="text-sm">To Location *</label>
          <input
            value={toStation}
            onChange={e => setToStation(e.target.value)}
            className="w-full bg-slate-800 p-2 rounded"
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm">Remarks</label>
          <textarea
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="w-full bg-slate-800 p-2 rounded"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-600 rounded"
        >
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
  );
}
