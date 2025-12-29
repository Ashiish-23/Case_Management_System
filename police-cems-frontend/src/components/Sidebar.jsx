import { useNavigate, Link } from "react-router-dom";

export default function Sidebar() {

    const navigate = useNavigate();

  return (
    <aside className="sidebar">

      <nav>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>POLICE — CEMS</Link>
        <br /> <br /> Case & Evidence Menu <br /><br />
        <li onClick={()=>navigate("/cases/create")}>➕ Create Case</li>
      </nav>
    </aside>
  );
}
