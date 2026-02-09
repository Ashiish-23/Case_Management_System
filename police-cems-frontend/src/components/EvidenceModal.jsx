import { useEffect } from "react";

export default function EvidenceModal({ data, close }) {

  /* ================= ESC KEY CLOSE ================= */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") close?.();
    };

    window.addEventListener("keydown", handler);

    // Lock background scroll
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "auto";
    };
  }, [close]);

  /* ================= HARD GUARDS ================= */
  if (!data || typeof data !== "object") return null;

  const safeText = (val) => {
    if (val === null || val === undefined) return "-";
    return String(val);
  };

  const safeDate = (val) => {
    try {
      if (!val) return "-";
      const d = new Date(val);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return "-";
    }
  };

  /* ================= SAFE IMAGE URL ================= */
  const buildSafeImageUrl = (path) => {
    if (!path) return null;

    // Block dangerous protocols
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("javascript:") ||
      path.startsWith("data:")
    ) {
      return null;
    }

    return `http://localhost:5000/${path.replace(/^\/+/, "")}`;
  };

  const safeImageUrl = buildSafeImageUrl(data.image_url);

  /* ================= STYLES ================= */
  const labelStyle =
    "block text-xs font-bold text-white uppercase tracking-wider mb-1";

  const valueBoxStyle =
    "bg-zinc-950/50 border border-slate-700/50 rounded-lg p-3 text-slate-200 text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">

      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="bg-zinc-950/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Evidence Details
            </h3>
          </div>

          <button
            onClick={close}
            className="text-white hover:bg-slate-700 p-1 rounded-md"
            aria-label="Close evidence details"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 overflow-y-auto">

          {/* ID + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Evidence ID</label>
              <div className={`${valueBoxStyle} font-mono text-blue-400`}>
                {safeText(data.evidence_code)}
              </div>
            </div>

            <div>
              <label className={labelStyle}>Category</label>
              <div className={valueBoxStyle}>
                {safeText(data.category || "Uncategorized")}
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className={labelStyle}>Description</label>
            <div className={`${valueBoxStyle} min-h-[80px]`}>
              {safeText(data.description)}
            </div>
          </div>

          {/* META */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Logged By</label>
              <div className={valueBoxStyle}>
                {safeText(data.logged_by || "Unknown Officer")}
              </div>
            </div>

            <div>
              <label className={labelStyle}>Date Logged</label>
              <div className={valueBoxStyle}>
                {safeDate(data.logged_at)}
              </div>
            </div>
          </div>

          {/* IMAGE */}
          {safeImageUrl && (
            <div>
              <label className={labelStyle}>Attached Visual Proof</label>
              <div className="mt-1 rounded-lg border border-slate-700 overflow-hidden bg-black/40 p-1">
                <img
                  src={safeImageUrl}
                  alt="Evidence Proof"
                  className="w-full h-auto max-h-64 object-contain rounded"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800 shrink-0 flex justify-end">
          <button
            onClick={close}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-all active:scale-95 text-sm"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
