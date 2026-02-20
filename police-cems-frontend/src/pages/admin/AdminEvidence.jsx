import {
  useEffect,
  useState,
  useCallback,
  useMemo
} from "react";
import TransferModal from "../../components/TransferModal";
import { useNavigate } from "react-router-dom";


/* ================= SECURE FETCH ================= */

async function secureFetch(url, options = {}) {

  const token = sessionStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      ...options.headers
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok)
    throw new Error(data.error || `Server error (${res.status})`);

  return data;
}


/* ================= SECURITY HELPERS ================= */

function safeText(v, max = 200) {
  if (typeof v !== "string") return "";
  return v.replace(/[<>]/g, "").slice(0, max);
}

function safeId(v) {
  if (!v) return "";
  return String(v).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
}



/* ================= COMPONENT ================= */

export default function AdminEvidence() {

  const navigate = useNavigate();

  const [evidence, setEvidence] = useState([]);
  const [busy, setBusy] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedEvidence, setSelectedEvidence] = useState(null);



  /* ================= LOAD EVIDENCE ================= */

  const loadEvidence = useCallback(async () => {

    try {

      setLoading(true);
      setError(null);

      const result = await secureFetch(
        `http://localhost:5000/api/admin/evidence?page=${page}&limit=15&search=${encodeURIComponent(search)}`
      );

      setEvidence(result.data || []);
      setTotalPages(result.totalPages || 1);

    }
    catch (err) {

      console.error("Evidence fetch error:", err);
      setError(err.message);

    }
    finally {

      setLoading(false);

    }

  }, [page, search]);


  useEffect(() => {

    loadEvidence();

  }, [loadEvidence]);



  /* ================= SEARCH ================= */

  function handleSearch(e) {

    e.preventDefault();

    const trimmed = searchInput.trim();

    setPage(1);
    setSearch(trimmed);

  }



  /* ================= PAGINATION ================= */

  function goToPage(p) {

    if (p < 1 || p > totalPages)
      return;

    setPage(p);

  }



  /* ================= MODAL ACTIONS ================= */

  function openTransfer(evidenceId) {

    if (busy) return;

    const safeEvidenceId = safeId(evidenceId);

    if (!safeEvidenceId) return;

    setBusy(true);

    try {

      navigate(`/admin/transfers/new/${safeEvidenceId}`);

    }
    finally {

      setTimeout(() => setBusy(false), 500);

    }

  }


  function openHistory(evidenceId) {

    if (busy) return;

    const safeEvidenceId = safeId(evidenceId);

    if (!safeEvidenceId) return;

    setBusy(true);

    try {

      navigate(`/admin/transfers/history/${safeEvidenceId}`);

    }
    finally {

      setTimeout(() => setBusy(false), 500);

    }

  }



  /* ================= UI ================= */

  return (

    <div className="pt-6 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-2xl font-semibold text-white">
            Evidence Management
          </h1>

          <p className="text-slate-400 text-sm">
            Monitor, transfer, and audit all evidence records
          </p>

        </div>

      </div>



      {/* TABLE CONTAINER */}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">



        {/* TABLE HEADER */}

        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700">

          <div className="font-semibold text-white">
            Evidence Ledger
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">

            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search evidence code, case, station, officer..."
              className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white w-72 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white text-sm"
            >
              Search
            </button>

          </form>

        </div>



        {/* TABLE */}

        <table className="w-full">

          <thead className="bg-slate-900">

            <tr>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Evidence Code
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Case Number
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Station
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Officer
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Category
              </th>

              <th className="px-6 py-3 text-left text-sm text-slate-300">
                Logged Time
              </th>

            </tr>

          </thead>



          <tbody>

            {loading && (

              <tr>
                <td colSpan="6" className="text-center py-6 text-slate-400">
                  Loading evidence...
                </td>
              </tr>

            )}


            {error && (

              <tr>
                <td colSpan="6" className="text-center py-6 text-red-400">
                  {error}
                </td>
              </tr>

            )}


            {!loading && !error && evidence.length === 0 && (

              <tr>
                <td colSpan="6" className="text-center py-6 text-slate-400">
                  No evidence found
                </td>
              </tr>

            )}


            {!loading && !error && evidence.map(e => (

              <tr
                key={safeId(e.id)}
                onClick={() => setSelectedEvidence(e)}
                className="border-t border-slate-700 hover:bg-slate-700 cursor-pointer transition"
              >

                <td className="px-6 py-3 font-mono text-sm text-white">
                  {safeText(e.evidence_code, 80)}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(e.case_number, 80) || "—"}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(e.station_name, 120) || "—"}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(e.officer_name, 120) || "—"}
                </td>

                <td className="px-6 py-3 text-white">
                  {safeText(e.category, 80) || "—"}
                </td>

                <td className="px-6 py-3 text-slate-300 text-sm">
                  {e.logged_at
                    ? new Date(e.logged_at).toLocaleString()
                    : "—"}
                </td>

              </tr>

            ))}

          </tbody>

        </table>



        {/* PAGINATION */}

        <div className="flex justify-center gap-2 py-4 border-t border-slate-700">

          <button
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Previous
          </button>


          {[...Array(totalPages)].map((_, i) => {

            const p = i + 1;

            return (

              <button
                key={p}
                onClick={() => goToPage(p)}
                className={
                  page === p
                    ? "bg-blue-600 px-4 py-2 rounded-lg"
                    : "bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                }
              >
                {p}
              </button>

            );

          })}


          <button
            disabled={page === totalPages}
            onClick={() => goToPage(page + 1)}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Next
          </button>

        </div>


      </div>



      {/* MODAL */}

      {selectedEvidence && (

        <EvidenceActionModal
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
          onTransfer={openTransfer}
          onHistory={openHistory}
          busy={busy}
        />

      )}

    </div>

  );

}



/* ================= MODAL ================= */

function EvidenceActionModal({
  evidence,
  onClose,
  onTransfer,
  onHistory,
  busy
}) {

  const safeEvidence = useMemo(() => ({
    id: safeId(evidence?.id),
    code: safeText(evidence?.evidence_code, 80)
  }), [evidence]);



  return (

    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-96">

        <h2 className="text-lg font-semibold text-white mb-2">
          Evidence Actions
        </h2>

        <div className="text-sm text-slate-400 mb-4">
          {safeEvidence.code}
        </div>


        <div className="flex flex-col gap-2">

          <button
            onClick={() => onTransfer(safeEvidence.id)}
            disabled={busy}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white disabled:opacity-50"
          >
            Transfer Evidence
          </button>

          <button
            onClick={() => onHistory(safeEvidence.id)}
            disabled={busy}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-white disabled:opacity-50"
          >
            View History
          </button>

          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white mt-2"
          >
            Close
          </button>

        </div>

      </div>

    </div>

  );

}