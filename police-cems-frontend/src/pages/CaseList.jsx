import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";

/* ================= SAFETY HELPERS ================= */
function safeArray(data) {
  return Array.isArray(data) ? data : [];
}

function safeText(v, max = 200) {
  if (typeof v !== "string") return "";
  return v.slice(0, max);
}

function safeDate(date) {
  try {
    const d = new Date(date);

    if (isNaN(d.getTime()))
      return "Invalid Date";

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "Invalid Date";
  }
}

/* ================= COMPONENT ================= */
export default function CaseTable({ cases = [], setSearchTerm }) {

  const navigate = useNavigate();
  const safeCases = safeArray(cases);
  const [inputValue, setInputValue] = useState("");

  /* ================= SEARCH ================= */
  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = inputValue.trim();

    if (trimmed.length === 0) {
      setSearchTerm("");
      return;
    }

    if (trimmed.length < 2)
      return;

    setSearchTerm(trimmed);
  }

  /* ================= NAVIGATION ================= */
  const goToCase = useCallback((caseId) => {
    if (!caseId) {
      console.error("Navigation blocked: missing case ID");
      return;
    }
    console.log("Navigating to case:", caseId);
    navigate(`/case/${caseId}`);
  }, [navigate]);

  /* ================= UI ================= */
  return (
    <div className="w-full rounded-xl shadow-lg border border-slate-700">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white tracking-wide"> Registered Case Records </h3>
        <form onSubmit={handleSubmit} className="flex items-center">
          <input type="text" placeholder="Search case number, title, category..." value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            className="bg-slate-800 border border-slate-600 px-4 py-2 rounded-lg text-sm text-white w-72 focus:outline-none focus:border-blue-500" />

          <button type="submit" className="ml-2 px-4 py-2 bg-blue-600 rounded-lg text-sm text-white hover:bg-blue-700" > Search </button>
        </form>
      </div>
      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-900/70 text-white text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left border-b border-slate-700"> Case Number </th>
              <th className="px-6 py-4 text-left border-b border-slate-700"> Title </th>
              <th className="px-6 py-4 text-left border-b border-slate-700"> Category </th>
              <th className="px-6 py-4 text-right border-b border-slate-700"> Registered Date </th>
            </tr>
          </thead>

          <tbody>
            {safeCases.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-sm text-slate-400 italic" > No case records found. </td>
              </tr>
            ) : (
              safeCases.map((c) => {
                const caseId = c?.id;
                const caseNumber = safeText(c?.case_number, 50);
                const title = safeText(c?.case_title, 200);
                const type = safeText(c?.case_type, 100);
                const regDate = safeDate(c?.registered_date);
                return (
                  <tr Key={caseId} onClick={() => goToCase(caseId)} className="cursor-pointer hover:bg-slate-700/30 text-sm transition-colors" >
                    <td className="px-6 py-4 font-mono text-white"> {caseNumber} </td>
                    <td className="px-6 py-4 text-slate-200"> {title} </td>
                    <td className="px-6 py-4 text-white"> {type} </td>
                    <td className="px-6 py-4 text-right font-mono text-white"> {regDate} </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
