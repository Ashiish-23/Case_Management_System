import { useEffect, useState, useCallback } from "react";

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
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* ================= COMPONENT ================= */
export default function AdminStations() {
  const [stations, setStations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
  name: "",
  code: "",
  address: "",
  city: "",
  district: "",
  state: "Karnataka",
  pincode: "",
  contact_phone: "",
  contact_email: ""
});

/* ================= LOAD ================= */
const loadStations = useCallback(async () => {
  try {
    setLoading(true);
    const result = await secureFetch(
      `http://localhost:5000/api/admin/stations?page=${page}&limit=15&search=${encodeURIComponent(search)}`
    );
    setStations(result.data || []);
    setTotalPages(result.totalPages || 1);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [page, search]);

useEffect(() => {
  loadStations();
}, [loadStations]);

/* ================= SEARCH ================= */
const handleSearch = (e) => {
  e.preventDefault();
  setPage(1);
  setSearch(searchInput.trim());
};

/* ================= CREATE ================= */
const createStation = async () => {
  try {
    await secureFetch(
      "http://localhost:5000/api/admin/stations",
      {
        method: "POST",
        body: JSON.stringify(form)
      }
    );
    setShowCreateModal(false);
    setForm({
      name: "",
      code: "",
      address: "",
      city: "",
      district: "",
      state: "Karnataka",
      pincode: "",
      contact_phone: "",
      contact_email: ""
    });
    loadStations();
  } catch (err) {
    alert(err.message);
  }
};

/* ================= TOGGLE ================= */
const toggleStatus = async (station) => {
  try {
        await secureFetch(
  `http://localhost:5000/api/admin/stations/${station.id}/toggle`,
  { method: "PATCH",
        body: JSON.stringify({
          ...station,
          status: station.status === "active"
            ? "inactive"
            : "active"
        })
      }
    );
    loadStations();
  } catch (err) {
    alert(err.message);
  }
};

/* ================= PAGINATION ================= */
const goToPage = (p) => {
  if (p < 1 || p > totalPages)
    return;
  setPage(p);
};

/* ================= UI ================= */
return (
<div className="pt-6 px-6 max-w-screen-2xl mx-auto text-white">
  {/* HEADER */}
  <div className="mb-6">
    <h1 className="text-2xl font-semibold">Stations Management</h1>
    <p className="text-slate-400 text-sm">Create, activate, deactivate, and manage police stations</p>
  </div>
  {/* SEARCH + CREATE BAR */}
  <div className="flex justify-between items-center mb-4">
    <form onSubmit={handleSearch} className="flex gap-2">
      <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search stations..."
        className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg w-80" />

      <button type="submit" className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500" >Search</button>
    </form>

    <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">
      + Create Station </button>
  </div>
  {/* LOADING STATE */}
  {loading && (
    <div className="mb-4 p-4 bg-slate-700 rounded-lg text-center"> Loading stations... </div>
  )}
  {/* TABLE */}
  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-900">
        <tr>
          <th className="p-3 text-left">Station</th>
          <th className="p-3 text-left">Code</th>
          <th className="p-3 text-left">Contact</th>
          <th className="p-3 text-left">Email</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Officers</th>
          <th className="p-3 text-left">Cases</th>
          <th className="p-3 text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        {stations.map(station => (
          <tr key={station.id} className="border-t border-slate-700">
            <td className="p-3 font-medium"> {station.name} </td>
            <td className="p-3" > {station.code} </td>
            <td className="p-3"> {station.contact_phone} </td>
            <td className="p-3"> {station.contact_email} </td>
            <td className="p-3"> <span className={ station.status === "active" ? "text-green-400" : "text-red-400" }>
                {station.status} </span>
            </td>
            <td className="p-3"> {station.officer_count} </td>
            <td className="p-3"> {station.case_count} </td>
            <td className="p-3">
              <button onClick={() => toggleStatus(station)} className="bg-slate-700 px-3 py-1 rounded hover:bg-slate-600">
                Toggle </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  {/* PAGINATION */}
        <div className="flex justify-center items-center gap-3 py-6 border-t border-slate-800">
    <button disabled={page === 1} onClick={() => goToPage(page - 1)} className="bg-slate-700 px-3 py-1 rounded">Prev</button>
    {[...Array(totalPages)].map((_, i) => {
      const p = i + 1;
      return (
        <button key={p} onClick={() => goToPage(p)} className={ page === p ? "bg-blue-600 px-3 py-1 rounded" : "bg-slate-700 px-3 py-1 rounded" }
        > {p} </button>
      );
    })}
    <button disabled={page === totalPages} onClick={() => goToPage(page + 1)} className="bg-slate-700 px-3 py-1 rounded">Next</button>
  </div>
  {/* CREATE MODAL */}
{showCreateModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-blue-900 border border-blue-700 rounded-xl shadow-2xl w-full max-w-xl">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-blue-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white"> Create New Station </h3>
        <button onClick={() => setShowCreateModal(false)} className="text-blue-200 hover:text-white text-lg">✕</button>
      </div>
      {/* BODY */}
      <div className="p-6 space-y-4">
        {/* NAME */}
        <input placeholder="Station Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
        {/* CODE */}
        <input placeholder="Station Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
        {/* ADDRESS */}
        <textarea placeholder="Station Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value }) }
          rows={3} className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 resize-none"
        />
        {/* CITY */}
        <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
        {/* DISTRICT */}
        <input placeholder="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
        {/* STATE */}
        <input placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
        {/* PINCODE */}
        <input placeholder="Pincode" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
        {/* CONTACT PHONE */}
        <input placeholder="Contact Phone" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
        {/* CONTACT EMAIL */}
        <input placeholder="Contact Email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value }) }
          className="w-full bg-blue-950 border border-blue-700 px-4 py-3 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
        />
      </div>
      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-blue-700 flex justify-end gap-3">
        <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white">
          Cancel </button>
        <button onClick={createStation} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold">
          Create Station </button>
      </div>
    </div>
  </div>
)}
</div>
);
}