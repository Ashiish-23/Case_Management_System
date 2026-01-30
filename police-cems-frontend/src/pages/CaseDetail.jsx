import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import AddEvidenceModal from "../components/AddEvidenceModal";
import EvidenceActionModal from "../components/EvidenceActionModal";
import CaseStatusModal from "../components/CaseStatusModal"; 
import Topbar from "../components/Topbar";

export default function CaseDetail() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // ---------- LOAD DATA ----------
  const loadData = useCallback(() => {
    const token = localStorage.getItem("token");

    // CASE DETAILS
    fetch(`http://localhost:5000/api/cases/${id}`, {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(res => res.json())
      .then(setCaseData);

    // EVIDENCE LIST
    fetch(`http://localhost:5000/api/evidence/case/${id}`, {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(res => res.json())
      .then(setEvidence);

  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper for Status Badge Colors
  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CLOSED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'REOPENED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-white border-slate-500/20';
    }
  };

  if (!caseData) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        Loading secure case file...
      </div>
    </div>
  );

  return (
    // Main Layout Container
    <div className="flex min-h-screen bg-blue-900 text-slate-100 font-sans antialiased">

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <Topbar />
        
        {/* Scrollable Main Section */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* HEADER SECTION */}
          <div className="mb-8">
            <button 
              className="flex items-center text-white hover:text-white mb-6 transition-colors group"
              onClick={() => navigate("/dashboard")}
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">⬅</span> 
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

              {/* Status Button (Double Click to Change) */}
              <div className="text-right">
                <p className="text-xs text-white uppercase tracking-wider mb-2 font-semibold">Case Status</p>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95 shadow-lg ${getStatusStyle(caseData.status)}`}
                  onClick={() => setShowStatusModal(true)}
                  title="Double click to update status"
                >
                  {caseData.status}
                </button>
              </div>
            </div>
          </div>

          {/* EVIDENCE SECTION */}
          <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            
            {/* Section Header */}
            <div className="px-6 py-5 border-b border-slate-700/50 bg-blue-900/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <h3 className="text-lg font-bold text-white">Chain of Custody Log</h3>
              </div>

              <button
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                onClick={() => setShowAddModal(true)}
              >
                + Add Evidence
              </button>
            </div>

            {/* Evidence Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                
                <thead className="bg-slate-900/50 text-white uppercase text-xs tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-700">Evidence ID</th>
                    <th className="px-6 py-4 border-b border-slate-700">Description</th>
                    <th className="px-6 py-4 border-b border-slate-700">Category</th>
                    <th className="px-6 py-4 border-b border-slate-700">Logged By</th>
                    <th className="px-6 py-4 border-b border-slate-700">Current Station</th>
                    <th className="px-6 py-4 border-b border-slate-700 text-right">Date Logged</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700/50 text-sm">
                  {evidence.length > 0 ? (
                    evidence.map(e => (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedEvidence(e)}
                        className="hover:bg-slate-700/30 transition-colors cursor-pointer group"
                        title="Double click to manage evidence"
                      >
                        <td className="px-6 py-4 font-mono text-blue-400 font-medium group-hover:text-blue-300">
                          {e.evidence_code}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {e.description}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-700/40 border border-slate-600/50 px-2 py-1 rounded text-xs text-white">
                            {e.category ?? "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">
                          {e.officer_name ?? "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-white"> 
                          {e.current_station ?? "Unknown"} 
                        </td>
                        <td className="px-6 py-4 text-white text-right font-mono">
                          {new Date(e.logged_at).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-white italic">
                        No evidence logged for this case yet.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>

          </div>

        </main>
      </div>

      {/* --------- MODALS (Logic Preserved) ---------- */}
      {showAddModal &&
        <AddEvidenceModal
          caseId={id}
          onClose={() => setShowAddModal(false)}
          onAdded={() => loadData()}
        />
      }

      {selectedEvidence &&
        <EvidenceActionModal
          data={selectedEvidence}
          close={() => setSelectedEvidence(null)}
        />
      }

      {showStatusModal &&
        <CaseStatusModal
          caseId={id}
          currentStatus={caseData.status}
          onClose={() => setShowStatusModal(false)}
          onUpdated={() => loadData()}
        />
      }

    </div>
  );
}