import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

/* ================= SECURITY HELPERS ================= */

async function secureFetch(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

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

export default function CaseTable({ cases: initialCases = [] }) {

  const navigate = useNavigate();
  const [cases, setCases] = useState(safeArray(initialCases));

  /* ---------- Sync With Parent ---------- */
  useEffect(() => {
    setCases(safeArray(initialCases));
  }, [initialCases]);

  /* ---------- Authoritative Fetch ---------- */
  useEffect(() => {

    let mounted = true;

    async function loadCases() {

      const token = localStorage.getItem("token");
      if (!token) return;

      try {

        const res = await secureFetch(
          "http://localhost:5000/api/cases",
          {
            headers: { Authorization: "Bearer " + token }
          }
        );

        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          window.location.href = "/login";
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        if (mounted && Array.isArray(data)) {
          setCases(data);
        }

      } catch (err) {

        if (err.name === "AbortError") {
          console.warn("Cases fetch timeout");
        } else {
          console.error("Cases fetch error:", err);
        }

      }
    }

    loadCases();

    return () => {
      mounted = false;
    };

  }, []);

  /* ================= UI ================= */

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

              cases.map(c => {

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
