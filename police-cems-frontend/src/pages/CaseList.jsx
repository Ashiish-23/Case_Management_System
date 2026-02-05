import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CaseTable({ cases: initialCases = [] }) {
  const navigate = useNavigate();
  const [cases, setCases] = useState(initialCases);

  /* Sync with parent props */
  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  /* Fetch from backend once (authoritative source) */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/cases", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setCases(data);
      })
      .catch(err => console.error("Cases fetch error:", err));
  }, []);

  return (
    <div className="w-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white tracking-wide">
          Registered Case Records
        </h3>
        <span className="text-xs text-white uppercase tracking-wider font-medium">
          Total Cases: {cases.length}
        </span>
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
            {cases.length > 0 ? (
              cases.map(c => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/case/${c.id}`)}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-white group-hover:text-blue-300">
                    {c.case_number}
                  </td>

                  <td className="px-6 py-4 text-slate-200 font-medium">
                    {c.case_title}
                  </td>

                  <td className="px-6 py-4 text-white">
                    <span className="bg-blue-900/30 px-2 py-1 rounded text-xs">
                      {c.case_type}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-white text-right font-mono">
                    {new Date(c.registered_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                </tr>
              ))
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
