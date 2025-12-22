import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Reset Link:\n${data.resetLink}`);
      window.location.href = data.resetLink;
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password</h2>
        <p className="auth-subtitle">Reset access securely</p>

        <form className="auth-form" onSubmit={submit}>
          <input type="email" placeholder="Registered Email" onChange={e => setEmail(e.target.value)} required />
          <button className="auth-button">Send Reset Link</button>
          <button type="button" onClick={() => navigate("/login")}>Back</button>
        </form>
      </div>
    </div>
  );
}
