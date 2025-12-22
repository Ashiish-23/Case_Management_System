import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // optional, if stored
    navigate("/login");
  };

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h1>Officer Dashboard</h1><br/>
      </div>

      <p>Authenticated access only.</p>
      <p>Case, Evidence, and Audit modules will appear here.</p>

      <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
    </div>
  );
}
