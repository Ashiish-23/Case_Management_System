import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async e => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const res = await fetch("http://localhost:5000/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password })
    });

    if (res.ok) {
      alert("Password updated successfully");
      navigate("/login");
    } else {
      alert("Invalid or expired link");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Create a new secure password</p>

        <form className="auth-form" onSubmit={submit}>
          <input
            type="password"
            placeholder="New Password"
            onChange={e => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          <button className="auth-button">Update Password</button>
        </form>
      </div>
    </div>
  );
}
