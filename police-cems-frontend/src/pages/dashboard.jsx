import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import MarqueeStats from "../components/MarqueeStats";
import CaseTable from "./CaseList";

// You can delete this line now since we are using Tailwind classes directly
// import "../styles/Layout.css"; 

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    // --- Load Dashboard Stats ---
    fetch("http://localhost:5000/api/dashboard/stats", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            alert("Session expired. Please log in again.");
            localStorage.clear();
            navigate("/login");
            return null;
          }
          const text = await res.text();
          console.error("Stats API Error:", text);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setStats([
          { label: "Total Cases", value: data.totalCases },
          { label: "Evidence Items", value: data.evidenceItems },
          { label: "Transfers", value: data.transfers },
          { label: "Open Cases", value: data.openCases },
          { label: "Re-opened Cases", value: data.reopenedCases },
          { label: "Closed Cases", value: data.closedCases },
          { label: "Chain Violations", value: data.chainViolations }
        ]);
      })
      .catch(console.error);

    // --- Load Case List ---
    fetch("http://localhost:5000/api/cases", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            console.warn("Unauthorized fetching cases");
            return null;
          }
          const text = await res.text();
          console.error("Cases API Error:", text);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

  }, [navigate]);

  return (
    // Main Container: Dark theme, full height, flex layout
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">

      {/* Sidebar Container: Fixed width on the left */}
      <div className="w-64 flex-shrink-0 border-r border-slate-700/50 bg-slate-800">
        <Sidebar />
      </div>

      {/* Main Content Area: Grows to fill space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Section */}
        <header className="px-8 py-6 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Officer Dashboard
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Overview of active investigations and secure evidence chain.
          </p>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* Marquee Section */}
          <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
            <MarqueeStats stats={stats} />
          </div>

          {/* Loading State or Case Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              {/* Tailwind Spinner */}
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 animate-pulse">Loading secure case files...</p>
            </div>
          ) : (
            // The Table Container
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <CaseTable cases={cases} />
            </div>
          )}

        </main>
      </div>

    </div>
  );
}