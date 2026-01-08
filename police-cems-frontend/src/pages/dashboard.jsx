import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import MarqueeStats from "../components/MarqueeStats";
import CaseTable from "./CaseList";

import "../styles/Layout.css";

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
    <div className="layout">

      <Sidebar />

      <div className="main">

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
