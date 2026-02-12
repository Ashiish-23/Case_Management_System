import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import AddEvidenceModal from "../components/AddEvidenceModal";
import EvidenceActionModal from "../components/EvidenceActionModal";

/* ================= SECURITY HELPERS ================= */

function safeString(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeDate(v) {
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "Invalid Date";
    return d.toLocaleDateString("en-GB");
  } catch {
    return "Invalid Date";
  }
}

async function secureFetch(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ================= COMPONENT ================= */

export default function CaseDetail() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  /* ---------- LOAD DATA ---------- */
  const loadData = useCallback(async () => {

    const token = sessionStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const headers = {
      Authorization: "Bearer " + token
    };

    try {

      /* ===== CASE DETAILS ===== */
      const caseRes = await secureFetch(
        `http://localhost:5000/api/cases/${id}`,
        { headers }
      );

      if (caseRes.status === 401 || caseRes.status === 403) {
        sessionStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      if (caseRes.status === 404) {
        console.warn("Case not found — redirecting");
        navigate("/dashboard", { replace: true });
        return;
      }
      
      if (!caseRes.ok) {
        throw new Error("Case fetch failed");
      }

      const caseJson = await caseRes.json();

      setCaseData({
        case_number: safeString(caseJson.case_number),
        case_title: safeString(caseJson.case_title)
      });

      /* ===== EVIDENCE LIST ===== */
      const evRes = await secureFetch(
        `http://localhost:5000/api/evidence/case/${id}`,
        { headers }
      );

      if (!evRes.ok) throw new Error("Evidence fetch failed");

      const evJson = await evRes.json();

      const safeEvidence = safeArray(evJson).map(e => ({
        id: e.id,
        evidence_code: safeString(e.evidence_code),
        description: safeString(e.description),
        category: safeString(e.category),
        officer_name: safeString(e.officer_name),
        current_station: safeString(e.current_station),
        logged_at: e.logged_at
      }));

      setEvidence(safeEvidence);

    } catch (err) {

      console.error("Case detail load error:", err.message);

      setCaseData(null);
      setEvidence([]);

    }

  }, [id, navigate]);

  useEffect(() => {

    let mounted = true;

    if (mounted) loadData();

    return () => {
      mounted = false;
    };

  }, [loadData]);

  /* ---------- LOADING ---------- */
  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          Loading secure case record…
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="flex min-h-screen bg-blue-900 text-slate-100 font-sans antialiased">

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <main className="flex-1 overflow-y-auto p-8">

          {/* HEADER */}
          <div className="mb-8">
            <button
              className="flex items-center text-white mb-6 group"
              onClick={() => navigate("/dashboard")}
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">
                ⬅
              </span>
              Back to Dashboard
            </button>

            <div className="flex justify-between items-start bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div>
                <h2 className="text-4xl font-bold text-white tracking-tight mb-2 font-mono">
                  {caseData.case_number}
                </h2>
                <p className="text-xl text-white font-medium">
                  {caseData.case_title}
                </p>
              </div>
            </div>
          </div>

          {/* EVIDENCE LEDGER */}
          <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-700/50 bg-blue-900/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <h3 className="text-lg font-bold text-white">
                  Evidence Ledger & Custody
                </h3>
              </div>

              <button
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                onClick={() => setShowAddModal(true)}
              >
                + Add Evidence
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 text-white uppercase text-xs tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-700">Evidence Code</th>
                    <th className="px-6 py-4 border-b border-slate-700">Description</th>
                    <th className="px-6 py-4 border-b border-slate-700">Category</th>
                    <th className="px-6 py-4 border-b border-slate-700">Logged By</th>
                    <th className="px-6 py-4 border-b border-slate-700">Current Station</th>
                    <th className="px-6 py-4 border-b border-slate-700 text-right">Logged Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700/50 text-sm">
                  {evidence.length > 0 ? (
                    evidence.map(e => (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedEvidence(e)}
                        className="hover:bg-slate-700/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 font-mono text-blue-400 font-medium">
                          {e.evidence_code}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {e.description}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {e.category}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {e.officer_name}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {e.current_station}
                        </td>
                        <td className="px-6 py-4 text-white text-right font-mono">
                          {safeDate(e.logged_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-white italic">
                        No evidence has been recorded for this case.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <AddEvidenceModal
          caseId={id}
          onClose={() => setShowAddModal(false)}
          onAdded={loadData}
        />
      )}

      {selectedEvidence && (
        <EvidenceActionModal
          data={selectedEvidence}
          close={() => setSelectedEvidence(null)}
        />
      )}

    </div>
  );
}
