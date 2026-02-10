import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/* ================= SECURITY HELPERS ================= */

function sanitize(v) {
  return String(v || "")
    .trim()
    .replace(/[<>]/g, "");
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function strongPassword(pw) {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

async function secureFetch(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ================= COMPONENT ================= */

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

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = e =>
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

  /* ================= SUBMIT ================= */

  const submit = async e => {

    e.preventDefault();

    if (loading) return;

    /* SANITIZE */
    const clean = {
      name: sanitize(form.name),
      loginId: sanitize(form.loginId),
      email: sanitize(form.email).toLowerCase(),
      role: sanitize(form.role),
      password: form.password,
      confirmPassword: form.confirmPassword
    };

    /* VALIDATION */

    if (!clean.name || !clean.loginId || !clean.email || !clean.role) {
      alert("All fields required");
      return;
    }

    if (!validEmail(clean.email)) {
      alert("Invalid email format");
      return;
    }

    if (!strongPassword(clean.password)) {
      alert(
        "Password must contain:\n" +
        "• 8+ characters\n" +
        "• Uppercase letter\n" +
        "• Lowercase letter\n" +
        "• Number\n" +
        "• Special character"
      );
      return;
    }

    if (clean.password !== clean.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {

      const res = await secureFetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clean.name,
            loginId: clean.loginId,
            email: clean.email,
            password: clean.password,
            role: clean.role
          })
        }
      );

      let data = {};
      try { data = await res.json(); } catch {
        // Ignore JSON parse errors
      }

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      alert("Registration successful");
      navigate("/login");

    } catch (err) {

      if (err.name === "AbortError") {
        alert("Request timeout. Try again.");
      } else {
        alert(err.message || "Registration failed");
      }

    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  const inputStyle =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">

      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Officer Registration</h2>
        </div>

        <form className="space-y-4" onSubmit={submit}>

          <div className="grid grid-cols-2 gap-4">
            <input name="name" placeholder="Full Name"
              onChange={handleChange} required className={inputStyle}/>
            <input name="loginId" placeholder="Login ID"
              onChange={handleChange} required className={inputStyle}/>
          </div>

          <input name="email" type="email" placeholder="Official Email"
            onChange={handleChange} required className={inputStyle}/>

          <select name="role" onChange={handleChange}
            required className={inputStyle}>
            <option value="">Select Role</option>
            <option>Constable</option>
            <option>Head Constable</option>
            <option>Sub-Inspector</option>
            <option>Inspector</option>
            <option>DSP</option>
            <option>SP</option>
          </select>

          <div className="relative">
            <input name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={handleChange}
              required
              className={`${inputStyle} pr-12`}
            />
            <button type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-0 top-0 h-full px-4 text-white">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="relative">
            <input name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              onChange={handleChange}
              required
              className={`${inputStyle} pr-12`}
            />
            <button type="button"
              onClick={() => setShowConfirmPassword(s => !s)}
              className="absolute right-0 top-0 h-full px-4 text-white">
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button disabled={loading}
            className="w-full bg-blue-600 py-3 rounded text-white">
            {loading ? "Creating Account..." : "Register"}
          </button>

        </form>
      </div>
    </div>
  );
}
