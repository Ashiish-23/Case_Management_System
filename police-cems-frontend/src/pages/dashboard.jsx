import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import MarqueeStats from "../components/MarqueeStats";
import CaseTable from "./CaseList";

import "../styles/Layout.css";

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [cases, setCases] = useState([]);   // <<< FIXED
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    // ---------- FETCH DASHBOARD STATS ----------
    fetch("http://localhost:5000/api/dashboard/stats", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Dashboard Stats:", data);

        setStats([
          { label: "Total Cases", value: data.totalCases },
          { label: "Evidence Items", value: data.totalEvidence },
          { label: "Pending Transfers", value: data.pendingTransfers },
          { label: "Chain Violations", value: data.violations }
        ]);
      });

    // ---------- FETCH CASE LIST ----------
    fetch("http://localhost:5000/api/cases", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log("CASE API DATA:", data);
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Case Fetch Failed:", err);
        setLoading(false);
      });

  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="layout">

      <Sidebar />

      <div className="main">

        <Topbar user={{ name: "Officer" }} onLogout={logout} />

        <h2>Officer Dashboard</h2>

        <MarqueeStats stats={stats} />

        {loading ? (
          <p>Loading cases…</p>
        ) : (
          <CaseTable cases={cases} />
        )}

      </div>

    </div>
  );
}
