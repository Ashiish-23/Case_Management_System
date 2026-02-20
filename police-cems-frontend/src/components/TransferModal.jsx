import { useState } from "react";

export default function TransferModal({ evidence, onClose }) {

  const [toStation, setToStation] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= SAFE HELPERS ================= */
  const safeTrim = (v) => (v || "").trim();
  const isValidEmail = (email) => { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); };

  /* ================= TRANSFER SUBMIT ================= */
  const submitTransfer = async () => {
    if (loading) return; // 🚫 double submit guard

    /* ---------- AUTH CHECK ---------- */
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please login again.");
      return;
    }

    /* ---------- EVIDENCE SAFETY ---------- */
    if (!evidence || !evidence.id) {
      alert("Invalid evidence reference");
      return;
    }

    /* ---------- NORMALIZE INPUT ---------- */
    const station = safeTrim(toStation);
    const officer = safeTrim(officerId);
    const email = safeTrim(officerEmail).toLowerCase();
    const reason = safeTrim(remarks);

    /* ---------- VALIDATION ---------- */
    if (!station || !officer || !email || !reason) {
      alert("All transfer fields are mandatory");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Invalid email format");
      return;
    }

    if (station.length > 120 || reason.length > 500) {
      alert("Input too long");
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(
        "http://localhost:5000/api/transfers/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          body: JSON.stringify({
            evidenceId: evidence.id,
            toStation: station,
            toOfficerId: officer,
            toOfficerEmail: email,
            reason: reason
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      /* ---------- SESSION HANDLING ---------- */
      if (res.status === 401 || res.status === 403) {
        alert("Session expired. Please login again.");
        sessionStorage.clear();
        window.location.href = "/login";
        return;
      }

      /* ---------- SAFE JSON PARSE ---------- */
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned invalid response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Transfer failed");
      }

      /* ---------- EMAIL RESULT ---------- */
      if (data.emailSent === false) {
        alert("Transfer completed. Email notification failed.");
      } else {
        alert("Transfer completed successfully");
      }
      onClose?.();
    } catch (err) {
      if (err.name === "AbortError") {
        alert("Request timed out. Please try again.");
      } else {
        alert(err.message || "Transfer failed");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-blue-600 flex justify-between">
          <h3 className="text-white font-bold">New Transfer</h3>
          <button onClick={onClose} className="text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 text-white">
          <input disabled value={evidence?.evidence_code || ""} className="w-full bg-slate-800 p-2 rounded border" />
          <input disabled value={evidence?.current_station || "Unknown"} className="w-full bg-slate-800 p-2 rounded border" />
          <input required value={toStation} maxLength={120} onChange={e => setToStation(e.target.value)} placeholder="To Location" className="w-full bg-slate-800 p-2 rounded border"/>
          <input required value={officerId} maxLength={80} onChange={e => setOfficerId(e.target.value)} placeholder="Officer ID" className="w-full bg-slate-800 p-2 rounded border" />
          <input required value={officerEmail} maxLength={120} onChange={e => setOfficerEmail(e.target.value)} placeholder="Officer Email" className="w-full bg-slate-800 p-2 rounded border" />
          <textarea required rows={3} maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Reason / Remarks" className="w-full bg-slate-800 p-2 rounded border" />
        </div>

        <div className="px-6 py-4 border-t border-blue-600 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded" disabled={loading} > Cancel </button>
          <button disabled={loading} onClick={submitTransfer} className="px-6 py-2 bg-blue-600 rounded disabled:opacity-50">
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
