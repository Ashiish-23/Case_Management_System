import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateCase() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    caseTitle: "",
    caseType: "",
    description: "",
    officerName: "",
    officerRank: "",
    stationName: "",
    firNumber: ""
  });

  const [loading, setLoading] = useState(false);

  /* ================= SAFE HELPERS ================= */

  const safeTrim = v => (v || "").trim();

  const change = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /* ================= SUBMIT ================= */

  const submit = async e => {
    e.preventDefault();

    if (loading) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    /* ---------- NORMALIZE ---------- */
    const payload = {
      caseTitle: safeTrim(form.caseTitle),
      caseType: safeTrim(form.caseType),
      description: safeTrim(form.description),
      officerName: safeTrim(form.officerName),
      officerRank: safeTrim(form.officerRank),
      stationName: safeTrim(form.stationName),
      firNumber: safeTrim(form.firNumber)
    };

    /* ---------- VALIDATION ---------- */

    if (
      !payload.caseTitle ||
      !payload.caseType ||
      !payload.description ||
      !payload.officerName ||
      !payload.officerRank ||
      !payload.stationName
    ) {
      alert("All required fields must be filled");
      return;
    }

    if (
      payload.caseTitle.length > 150 ||
      payload.description.length > 2000 ||
      payload.stationName.length > 150
    ) {
      alert("Input too long");
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {

      const res = await fetch(
        "http://localhost:5000/api/cases/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      /* ---------- SESSION CHECK ---------- */
      if (res.status === 401 || res.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      /* ---------- SAFE JSON ---------- */
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create case");
      }

      alert(`Case created successfully.\nCASE ID: ${data.caseNumber}`);
      navigate("/dashboard");

    } catch (err) {

      if (err.name === "AbortError") {
        alert("Request timeout. Please try again.");
      } else {
        alert(err.message || "Server error");
      }

    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  const labelStyle =
    "block text-xs font-medium text-white mb-1 uppercase tracking-wider";

  const inputStyle =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-blue-900 py-10 px-4 flex justify-center items-start">

      <div className="max-w-4xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-slate-900/50 px-8 py-6 border-b border-slate-700 text-center">
          <h1 className="text-3xl font-bold text-white">
            Case Registration Form
          </h1>
        </div>

        <form className="p-8 space-y-6" onSubmit={submit}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className={labelStyle}>Case Title *</label>
              <input
                name="caseTitle"
                maxLength={150}
                onChange={change}
                required
                className={inputStyle}
              />
            </div>

            <div>
              <label className={labelStyle}>Case Type *</label>
              <select
                name="caseType"
                onChange={change}
                required
                className={inputStyle}
              >
                <option value="">Select Case Type</option>
                <option>Theft</option>
                <option>Cyber Crime</option>
                <option>Homicide</option>
                <option>Narcotics</option>
                <option>Financial Fraud</option>
              </select>
            </div>

          </div>

          <div>
            <label className={labelStyle}>Description *</label>
            <textarea
              name="description"
              rows="4"
              maxLength={2000}
              onChange={change}
              required
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className={labelStyle}>Officer Name *</label>
              <input name="officerName" onChange={change} required className={inputStyle} />
            </div>

            <div>
              <label className={labelStyle}>Officer Rank *</label>
              <input name="officerRank" onChange={change} required className={inputStyle} />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className={labelStyle}>Station Name *</label>
              <input name="stationName" onChange={change} required className={inputStyle} />
            </div>

            <div>
              <label className={labelStyle}>FIR Number</label>
              <input name="firNumber" onChange={change} className={inputStyle} />
            </div>

          </div>

          <div className="pt-6 border-t border-slate-700 flex justify-end gap-4">

            <button
              type="button"
              disabled={loading}
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 border border-slate-600 text-white rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 px-8 py-3 rounded-lg text-white disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Register Case"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}
