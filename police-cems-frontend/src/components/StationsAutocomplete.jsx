import { useState, useEffect, useRef } from "react";

async function secureFetch(url) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + token }
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export default function StationAutocomplete({ value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await secureFetch(
          `http://localhost:5000/api/admin/stations/search?q=${encodeURIComponent(query)}`
        );
        setResults(data || []);
        setShow(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

  }, [query]);

  const handleSelect = (station) => {
    setQuery(station.name);
    setShow(false);
    onSelect(station);
  };

  return (
    <div className="relative w-full">

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search station..."
        className="w-full bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {show && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">

          {loading && (
            <div className="p-3 text-sm text-slate-400">
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-slate-400">
              No stations found
            </div>
          )}

          {!loading && results.map((station) => (
            <div
              key={station.id}
              onClick={() => handleSelect(station)}
              className="p-3 hover:bg-slate-700 cursor-pointer"
            >
              <div className="font-medium">{station.name}</div>
              <div className="text-xs text-slate-400">
                {station.city}, {station.district}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}