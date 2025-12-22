import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [data, setData] = useState({ loginId: "", password: "" });

  const handleChange = e =>
    setData({ ...data, [e.target.name]: e.target.value });

  const handleLogin = async e => {
  e.preventDefault();

  const res = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (res.ok) {
    // 🔐 STORE TOKEN & USER
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));

    navigate("/dashboard");
  } else {
    alert(result.error || "Login failed");
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Officer Login</h2>
        <p className="auth-subtitle">Authorized personnel only</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <input name="loginId" placeholder="Login ID" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <button className="auth-button">Login</button>
          <button type="button" onClick={() => navigate("/")}>Back</button>
        </form>

        <br /><Link to="/forgot-password" className="auth-link">
          Forgot password?
        </Link>

        <div className="auth-footer">
          Police Evidence Management System
        </div>
      </div>
    </div>
  );
}
