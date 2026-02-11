import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
    if (isNaN(d.getTime())) return "Invalid Date";

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

  /* ===== Trigger search only on submit ===== */
  function handleSubmit(e) {
    e.preventDefault();

    const trimmed = inputValue.trim();

    if (trimmed.length === 0) {
      setSearchTerm(""); // reset
      return;
    }

    if (trimmed.length < 2) {
      return; // prevent tiny noisy searches
    }

    setSearchTerm(trimmed);
  }

  return (
    <div className="w-full rounded-xl shadow-lg border border-slate-700">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white tracking-wide">
          Registered Case Records
        </h3>

        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            placeholder="Search case number, title, category..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="bg-slate-800 border border-slate-600 px-4 py-2 rounded-lg text-sm text-white w-72 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-blue-600 rounded-lg text-sm text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          <thead className="bg-slate-900/70 text-white uppercase text-xs tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4 border-b border-slate-700">Case Number</th>
              <th className="px-6 py-4 border-b border-slate-700">Title</th>
              <th className="px-6 py-4 border-b border-slate-700">Category</th>
              <th className="px-6 py-4 border-b border-slate-700 text-right">
                Registered Date
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50 text-sm">

            {safeCases.length > 0 ? (
              safeCases.map(c => {

                const safeId = safeText(c?.id, 64);
                const caseNumber = safeText(c?.case_number, 50);
                const title = safeText(c?.case_title, 200);
                const type = safeText(c?.case_type, 100);
                const regDate = safeDate(c?.registered_date);

                return (
                  <tr
                    key={safeId}
                    onClick={() => safeId && navigate(`/case/${safeId}`)}
                    className="hover:bg-slate-700/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono text-white group-hover:text-blue-300">
                      {caseNumber}
                    </td>

                    <td className="px-6 py-4 text-slate-200 font-medium">
                      {title}
                    </td>

                    <td className="px-6 py-4 text-white">
                      <span className="bg-blue-900/30 px-2 py-1 rounded text-xs">
                        {type}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-white text-right font-mono">
                      {regDate}
                    </td>
                  </tr>
                );

              })
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-white italic">
                  No case records found.
                </td>
              </tr>
            )}

          </tbody>

        </table>
      </div>

    </div>
  );
}
