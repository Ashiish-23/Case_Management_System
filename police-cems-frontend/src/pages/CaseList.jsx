import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CaseTable({ cases: initialCases = [] }) {

  const navigate = useNavigate();
  const [cases, setCases] = useState(initialCases);

  // Sync with parent props
  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  // Fetch directly from backend once (Keeping your existing logic)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/cases", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            console.warn("Unauthorized fetching cases");
            return null;
          }
          const text = await res.text();
          console.error("Cases API Error:", text);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setCases(data);
      })
      .catch(err => console.error(err));
  }, []);

  // Helper to color-code the status badges
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'closed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'reopened': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-white border-slate-500/20';
    }
  };

  return (
    // Main Wrapper (Full width, no external padding so it fits in the dashboard card)
    <div className="w-full">

      {/* Table Header / Title */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white tracking-wide">
          Registered Cases
        </h3>
        <span className="text-xs text-white uppercase tracking-wider font-medium">
          Total: {cases.length} Records
        </span>
      </div>

      {/* Table Container (Scrollable) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          
          {/* Table Head */}
          <thead className="bg-slate-900/70 text-white uppercase text-xs tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4 border-b border-slate-700">Case Number</th>
              <th className="px-6 py-4 border-b border-slate-700">Title</th>
              <th className="px-6 py-4 border-b border-slate-700">Category</th>
              <th className="px-6 py-4 border-b border-slate-700 text-center">Status</th>
              <th className="px-6 py-4 border-b border-slate-700 text-right">Registered</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-700/50 text-sm">
            {cases.length > 0 ? (
              cases.map(c => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/case/${c.id}`)}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer group"
                >
                  
                  {/* Case Number (Monospace font for ID feel) */}
                  <td className="px-6 py-4 font-mono text-white group-hover:text-blue-300 transition-colors">
                    {c.case_number}
                  </td>
                  
                  {/* Title (White text) */}
                  <td className="px-6 py-4 text-slate-200 font-medium">
                    {c.case_title}
                  </td>
                  
                  {/* Category (Subtle text) */}
                  <td className="px-6 py-4 text-white">
                    <span className="bg-blue-900/30 px-2 py-1 rounded text-xs">
                      {c.case_type}
                    </span>
                  </td>

                  {/* Status Badge (Center aligned) */}
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusStyle(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                
                  {/* Date (Right aligned, muted) */}
                  <td className="px-6 py-4 text-white text-right">
                    {new Date(c.registered_date).toLocaleDateString("en-GB", {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                </tr>
              ))
            ) : (
              // Empty State
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-white">
                  No cases found in the database.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}