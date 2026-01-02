import { useNavigate, Link } from "react-router-dom";

export default function Sidebar() {

  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-content">

        <nav>
          <Link style={{ fontSize: "20px", fontWeight: "bold" }}
            to="/dashboard" 
            className="sidebar-logo"
          >
            POLICE — CEMS
          </Link>

          <div className="menu-title">
            Case & Evidence Menu
          </div>

          <ul className="menu-list">
            <li onClick={() => navigate("/cases/create")}>
              ➕ Create Case
            </li>
          </ul>
        </nav>

      </div>

      {/* Bottom Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

    </aside>
  );
}
