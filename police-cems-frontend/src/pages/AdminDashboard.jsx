import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ================= FETCH HELPER ================= */
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    async function loadAdminData() {
      try {
        const statsRes =
          await secureFetch(
            "http://localhost:5000/api/admin/stats"
          );

        if (statsRes.status === 403) {
          alert("Admin access required");
          navigate("/dashboard");
          return;
        }

        const statsData = await statsRes.json();
        setStats(statsData);
        const usersRes =
          await secureFetch(
            "http://localhost:5000/api/admin/users"
          );

        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      catch (err) {
        console.error("Admin load error:", err);
      }
      finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [navigate]);

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading admin panel...
      </div>
    );
  }
  return (
    <div className="p-8 text-white max-w-screen-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Admin Control Panel
      </h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Users" value={stats.users} />
          <StatCard label="Cases" value={stats.cases} />
          <StatCard label="Evidence" value={stats.evidence} />
          <StatCard label="Transfers" value={stats.transfers} />
          <StatCard label="Stations" value={stats.stations} />
        </div>
      )}

      {/* Users table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="p-3 text-left">Login ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Station</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}
                  className="border-t border-slate-700">

                <td className="p-3">
                  {user.login_id}
                </td>

                <td className="p-3">
                  {user.full_name}
                </td>

                <td className="p-3">
                  {user.role}
                </td>

                <td className="p-3">
                  {user.email || "—"}
                </td>

                <td className="p-3">
                  {user.station || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ label, value }) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <div className="text-slate-400 text-sm">
        {label}
      </div>

      <div className="text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}
