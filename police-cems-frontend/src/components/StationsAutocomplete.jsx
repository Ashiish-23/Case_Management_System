import { useState, useEffect, useRef } from "react";

/* ================= SAFE FETCH ================= */
async function secureFetch(url) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || "Search failed");
  }

  return res.json();
}

export default function StationAutocomplete({ value = "", onSelect }) {

  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const requestRef = useRef(0);   // prevents race conditions

  /* ================= SYNC WITH PARENT ================= */
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  /* ================= SEARCH ================= */
  useEffect(() => {

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setShow(false);
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {

      const currentRequest = ++requestRef.current;

      try {
        setLoading(true);

        const data = await secureFetch(
          `http://localhost:5000/api/stations/search?q=${encodeURIComponent(trimmed)}`
        );

        // prevent outdated responses from overwriting newer results
        if (currentRequest !== requestRef.current) return;

        setResults(data || []);
        setShow(true);
        setHighlightIndex(-1);

      } catch (err) {
        console.error("Station search error:", err.message);
        setResults([]);
        setShow(false);
      } finally {
        setLoading(false);
      }

    }, 300);

    return () => clearTimeout(debounceRef.current);

  }, [query]);

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {

    function handleOutsideClick(e) {
      if (containerRef.current &&
          !containerRef.current.contains(e.target)) {
        setShow(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);

  }, []);

  /* ================= SELECT ================= */
  function handleSelect(station) {
    setQuery(station.name);
    setShow(false);
    setHighlightIndex(-1);
    onSelect?.(station);
  }

  /* ================= KEYBOARD SUPPORT ================= */
  function handleKeyDown(e) {

    if (!show) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(prev =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(prev =>
        prev > 0 ? prev - 1 : 0
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && results[highlightIndex]) {
        handleSelect(results[highlightIndex]);
      }
    }

    if (e.key === "Escape") {
      setShow(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setShow(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search station..."
        className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {!loading && results.map((station, index) => (
            <div
              key={station.id}
              onMouseDown={() => handleSelect(station)}
              className={`p-3 cursor-pointer transition ${
                index === highlightIndex
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-700"
              }`}
            >
              <div className="font-medium">
                {station.name}
              </div>
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