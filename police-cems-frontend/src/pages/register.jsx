import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    loginId: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  });

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return alert("Passwords do not match");

    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      alert("Registration successful");
      navigate("/login");
    } else {
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Officer Registration</h2>
        <p className="auth-subtitle">Official police accounts only</p>

        <form className="auth-form" onSubmit={submit}>
          <input name="name" placeholder="Full Name" onChange={handleChange} required />
          <input name="loginId" placeholder="Login ID" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Official Email" onChange={handleChange} required />
          <select name="role" onChange={handleChange} required>
            <option value="">Select Role</option>
            <option>Constable</option>
            <option>Head Constable</option>
            <option>Sub-Inspector</option>
            <option>Inspector</option>
            <option>DSP</option>
            <option>SP</option>
          </select>
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />
          <button className="auth-button" type="submit">Register</button>
          <button type="button" onClick={() => navigate("/")}>Back</button>
        </form>

        <div className="auth-footer">
          Registration subject to departmental approval
        </div>
      </div>
    </div>
  );
}
