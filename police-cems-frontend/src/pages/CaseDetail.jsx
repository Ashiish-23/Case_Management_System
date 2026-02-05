import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import AddEvidenceModal from "../components/AddEvidenceModal";
import EvidenceActionModal from "../components/EvidenceActionModal";
import Topbar from "../components/Topbar";

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  /* ---------- LOAD DATA ---------- */
  const loadData = useCallback(() => {
    const token = localStorage.getItem("token");

    // CASE DETAILS (IMMUTABLE FACT)
    fetch(`http://localhost:5000/api/cases/${id}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(setCaseData);

    // EVIDENCE LEDGER FOR CASE
    fetch(`http://localhost:5000/api/evidence/case/${id}`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(setEvidence);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  return (
    <div className="flex min-h-screen bg-blue-900 text-slate-100 font-sans antialiased">

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

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

            {/* TABLE */}
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
                        title="Click to view custody actions"
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
                          {new Date(e.logged_at).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-white italic"
                      >
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
