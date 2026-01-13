export default function EvidenceActionModal({ data, close }) {

  return (
    // Overlay
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      
      {/* Modal Card */}
      <div className="bg-blue-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-[fadeIn_0.2s_ease-out]">

        {/* Header */}
        <div className="bg-blue-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white tracking-tight">Evidence Actions</h3>
          <button 
            onClick={close}
            className="text-white hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">

          {/* Evidence Details Card */}
          <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 mb-6">
            
            <div className="mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Evidence ID</span>
              <span className="font-mono text-xl text-blue-400 tracking-wide">{data.evidence_code}</span>
            </div>
            
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Description</span>
              <p className="text-sm text-white leading-relaxed">{data.description}</p>
            </div>

          </div>

          <hr className="border-slate-700 mb-6" />

          {/* Action Buttons */}
          <div className="space-y-3">
            
            {/* Transfer Button (Disabled Style) */}
            <button 
              className="w-full border border-slate-700 bg-slate-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-75 hover:bg-slate-800"
              disabled
            >
              <span>🚚</span> Transfer Evidence (Coming Soon)
            </button>

            {/* Receive Button (Disabled Style) */}
            <button 
              className="w-full border border-slate-700 bg-slate-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-75 hover:bg-slate-800"
              disabled
            >
              <span>📥</span> Receive Evidence (Coming Soon)
            </button>

          </div>

          {/* Footer Close */}
          <div className="mt-6 flex justify-end">
            <button 
              onClick={close}
              className="px-4 py-2 rounded-lg text-white hover:text-white bg-blue-700 hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Close Menu
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}