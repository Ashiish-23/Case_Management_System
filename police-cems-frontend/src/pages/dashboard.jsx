import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import MarqueeStats from "../components/MarqueeStats";

import "../styles/Layout.css";

export default function Dashboard() {

  const navigate = useNavigate();
  const [stats, setStats] = useState([]);

  useEffect(() => {

    // 🔐 Check login
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    // 📊 Load dashboard stats
    fetch("http://localhost:5000/api/dashboard/stats", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats([
          { label: "Total Cases", value: data.totalCases },
          { label: "Evidence Items", value: data.totalEvidence },
          { label: "Pending Transfers", value: data.pendingTransfers },
          { label: "Chain Violations", value: data.violations }
        ]);
      })
      .catch(err => console.error(err));

  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="layout">

      {/* LEFT NAV */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="main">

        {/* HEADER BAR */}
        <Topbar user={{ name: "Officer" }} onLogout={logout} />

        <h2>Officer Dashboard</h2>

        {/* MOVING STATS BAR */}
        <MarqueeStats stats={stats} />

        <p>Modules loading…</p>

      </div>

    </div>
  );
}
