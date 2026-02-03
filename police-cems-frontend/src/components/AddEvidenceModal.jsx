import { useState } from "react";

export default function AddEvidenceModal({ caseId, onClose, onAdded }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [seizedAtStation, setSeizedAtStation] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!description.trim() || !category.trim() || !seizedAtStation.trim()) {
      alert("All fields are required");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication required. Please login again.");
      return;
    }

    const form = new FormData();
    form.append("caseId", caseId);
    form.append("description", description.trim());
    form.append("category", category.trim());
    form.append("seizedAtStation", seizedAtStation.trim());
    if (image) form.append("image", image);

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/evidence/add", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        },
        body: form
      });

      let payload;
      try {
        payload = await res.json();
      } catch {
        throw new Error("Server error. Please check backend logs.");
      }

      if (!res.ok) {
        throw new Error(payload.error || "Failed to add evidence");
      }

      // ✅ SUCCESS PATH ONLY
      onAdded?.();
      onClose();

    } catch (err) {
      console.error("Add evidence failed:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const labelStyle =
    "block text-xs font-medium text-white mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Add New Evidence</h2>
          <button onClick={onClose} className="text-white">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-5">

          <div>
            <label className={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.toLowerCase())}
              className={`${inputStyle} h-24 resize-none`}
              placeholder="Detailed description of the item..."
              required
            />
          </div>

          <div>
            <label className={labelStyle}>Category</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value.toLowerCase())}
              className={inputStyle}
              placeholder="Weapon / Theft / Digital Asset"
              required
            />
          </div>

          <div>
            <label className={labelStyle}>Station Name</label>
            <input
              value={seizedAtStation}
              onChange={e => setSeizedAtStation(e.target.value.toLowerCase())}
              className={inputStyle}
              placeholder="Police station name"
              required
            />
          </div>

          <div>
            <label className={labelStyle}>Upload Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImage(e.target.files[0])}
              className="text-white text-sm rounded-lg px-3 py-2"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-white px-4 py-2 hover:bg-slate-700 rounded-lg disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 px-6 py-2 rounded-lg text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Evidence"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
