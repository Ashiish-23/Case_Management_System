// Modal for viewing evidence details.
// import "../styles/modal.css"; // Deleted

export default function EvidenceModal({ data, close }) {

  if (!data) return null;

  // Helper for consistent label styling
  const labelStyle = "block text-xs font-bold text-white uppercase tracking-wider mb-1";
  
  // Helper for consistent data value boxes
  const valueBoxStyle = "bg-zinc-950/50 border border-slate-700/50 rounded-lg p-3 text-slate-200 text-sm";

  return (
    // Overlay: Fixed, dark blur
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">

      {/* Modal Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-zinc-950/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Evidence Details</h3>
          </div>
          <button 
            onClick={close} 
            className="text-white hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">

          {/* Evidence ID & Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Evidence ID</label>
              <div className={`${valueBoxStyle} font-mono text-blue-400 font-medium`}>
                {data.evidence_code}
              </div>
            </div>
            <div>
              <label className={labelStyle}>Category</label>
              <div className={valueBoxStyle}>
                {data.category || "Uncategorized"}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelStyle}>Description</label>
            <div className={`${valueBoxStyle} min-h-[80px]`}>
              {data.description}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Logged By</label>
              <div className={valueBoxStyle}>
                {data.logged_by || "Unknown Officer"}
              </div>
            </div>
            <div>
              <label className={labelStyle}>Date Logged</label>
              <div className={valueBoxStyle}>
                {new Date(data.logged_at).toLocaleString("en-GB", {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          </div>

          {/* Image Section */}
          {data.image_url && (
            <div>
              <label className={labelStyle}>Attached Visual Proof</label>
              <div className="mt-1 rounded-lg border border-slate-700 overflow-hidden bg-black/40 p-1">
                <img 
                  src={`http://localhost:5000${data.image_url}`}
                  alt="Evidence Proof"
                  className="w-full h-auto max-h-64 object-contain rounded"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800 shrink-0 flex justify-end">
          <button 
            onClick={close} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-sm"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
