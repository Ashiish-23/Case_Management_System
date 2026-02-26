import { useState } from "react";
import StationAutocomplete from "./StationsAutocomplete";

/* ================= SECURITY CONSTANTS ================= */
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
];

/* ================= HELPERS ================= */
function safeText(v) {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, 500);
}

async function secureFetch(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ================= COMPONENT ================= */
export default function AddEvidenceModal({
  caseId,
  onClose,
  onAdded
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [seizedAtStation, setSeizedAtStation] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= FILE VALIDATION ================= */
  function validateFile(file) {
    if (!file) return "File is required";

    if (!ALLOWED_MIME.includes(file.type)) {
      return "Only JPG, PNG, WEBP images allowed";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Max ${MAX_FILE_SIZE_MB}MB allowed`;
    }

    return null;
  }

  /* ================= SUBMIT ================= */
  const submit = async (e) => {
    e.preventDefault();

    const desc = safeText(description);
    const cat = safeText(category);
    const station = safeText(seizedAtStation);

    if (!desc || !cat || !station) {
      alert("All fields are required");
      return;
    }

    const fileError = validateFile(image);
    if (fileError) {
      alert(fileError);
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please login again.");
      return;
    }

    const formData = new FormData();
    formData.append("caseId", caseId);
    formData.append("description", desc);
    formData.append("category", cat);
    formData.append("seizedAtStation", station);
    formData.append("image", image);

    setLoading(true);

    try {
      const res = await secureFetch(
        "http://localhost:5000/api/evidence/add",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token
          },
          body: formData
        }
      );

      const payload = await res.json().catch(() => null);

      if (res.status === 401 || res.status === 403) {
        sessionStorage.clear();
        alert("Session expired. Please login again.");
        return;
      }

      if (!res.ok) {
        throw new Error(payload?.error || "Failed to add evidence");
      }

      alert("Evidence added successfully");

      onAdded?.();
      onClose();

    } catch (err) {
      if (err.name === "AbortError") {
        alert("Upload timeout. Please try again.");
      } else {
        console.error("Add evidence failed:", err);
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILE SELECT ================= */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      alert(error);
      e.target.value = "";
      return;
    }

    setImage(file);
  };

  /* ================= UI ================= */
  const inputStyle =
    "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const labelStyle =
    "block text-xs font-medium text-white mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg">

        <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Add New Evidence</h2>
          <button onClick={onClose} className="text-white">✕</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className={labelStyle}>Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputStyle} h-24 resize-none`} required/>
          </div>

          <div>
            <label className={labelStyle}>Category *</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputStyle} required />
          </div>

          <div>
            <label className={labelStyle}>Seized At Station *</label>
            <StationAutocomplete value={seizedAtStation} onSelect={(station) => setSeizedAtStation(station.name) } />
          </div>

          <div>
            <label className={labelStyle}> Upload Image (Max {MAX_FILE_SIZE_MB}MB) *
            </label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" required onChange={handleFileChange} className="text-white text-sm rounded-lg px-3 py-2"/>
          </div>

          <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} 
              className="text-white px-4 py-2 hover:bg-slate-700 rounded-lg disabled:opacity-50">Cancel </button>

            <button type="submit" disabled={loading} className="bg-blue-600 px-6 py-2 rounded-lg text-white hover:bg-blue-700 disabled:opacity-50"
            > {loading ? "Saving..." : "Save Evidence"} </button>
          </div>
        </form>
      </div>
    </div>
  );
}