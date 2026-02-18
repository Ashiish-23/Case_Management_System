import { useEffect, useState } from "react";

async function secureFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });
}

export default function AdminStations() {
  const [stations, setStations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newStation, setNewStation] = useState("");

  async function loadStations() {
    const res = await secureFetch(
      `http://localhost:5000/api/admin/stations?page=${page}&limit=15`
    );

    const result = await res.json();
    setStations(result.data || []);
    setTotalPages(result.totalPages || 1);
  }

  useEffect(() => {
    (async () => {
      await loadStations();
    })();
  }, [page]);

  async function createStation() {
    if (!newStation.trim()) return;

    await secureFetch(
      "http://localhost:5000/api/admin/stations",
      {
        method: "POST",
        body: JSON.stringify({
          name: newStation
        })
      }
    );
    setNewStation("");
    loadStations();
  }

  async function toggleStatus(name, status) {
    await secureFetch(
      `http://localhost:5000/api/admin/stations/${name}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      }
    );
    loadStations();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        Stations Management
      </h2>

      {/* Create station */}
      <div className="flex gap-2 mb-6">
        <input
          value={newStation}
          onChange={e => setNewStation(e.target.value)}
          placeholder="New station name"
          className="bg-slate-800 px-3 py-2 rounded"
        />
        <button
          onClick={createStation}
          className="bg-blue-600 px-4 py-2 rounded"
        > Create </button>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Officers</th>
            <th>Cases</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>

          {stations.map(station => (
            <tr key={station.name}>
              <td>{station.name}</td>
              <td>{station.status}</td>
              <td>{station.officer_count}</td>
              <td>{station.case_count}</td>
              <td>
                <button
                  onClick={() => toggleStatus(
                    station.name,
                    station.status === "active"
                      ? "inactive"
                      : "active"
                  )} > Toggle </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex gap-2 mt-6">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i+1)}
            className={`px-3 py-1 bg-slate-700 rounded ${i+1 === page ? "font-bold" : ""}`}> {i+1} </button>
        ))}
      </div>
    </div>
  );
}
