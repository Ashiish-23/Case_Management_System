// Login page for officers (hardened).
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    loginId: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= HARD RESET ON LOAD ================= */
  useEffect(() => { sessionStorage.clear(); }, []);// Prevent stale tokens from breaking auth flow 

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT ================= */
  const submit = async (e) => {
    e.preventDefault();

    if (loading) return; // UI-level brute force guard

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          loginId: form.loginId.trim(),
          password: form.password
        })
      });
      const data = await res.json();

      if (!res.ok) {
        // Generic error only — no signal leakage
        throw new Error("Invalid credentials");
      }

      /* ================= TOKEN VALIDATION ================= */
      if (!data?.token || typeof data.token !== "string") {
        throw new Error("Authentication failed");
      }

      /* ================= SAFE STORAGE ================= */
      sessionStorage.setItem("token", data.token);

      if (data.user?.role) {
        sessionStorage.setItem("userRole", data.user.role);
      }

      if (data.user?.id) {
        sessionStorage.setItem("userId", data.user.id);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login failed:", err.message);
      setError("Invalid login ID or password");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  return ( 
    <div className="bg-blue-900 flex items-center min-h-screen justify-center p-4 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-sm w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600 shadow-lg shadow-black/20">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight"> System Login </h2>
          <p className="text-white text-sm mt-2"> Police Evidence Management </p>
        </div>
        <form className="space-y-5" onSubmit={submit} autoComplete="off">
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wider">
              Officer ID <span className="text-red-500">*</span>
            </label>
            <input name="loginId" value={form.loginId} onChange={handleChange} required className={inputStyle} placeholder="Enter Badge Number"
              autoComplete="username" />
          </div>

          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wider">
              Secure Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange}
                required className={`${inputStyle} pr-12`} placeholder="Enter Password" autoComplete="current-password"/>

              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 px-4 text-slate-300 hover:text-white"
                aria-label="Toggle password visibility">{showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {/* ERROR DISPLAY */}
          {error && (
            <div className="text-sm text-red-400 text-center">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className={`w-full font-bold py-3 rounded-lg shadow-lg transition-all active:scale-95
              ${loading ? "bg-slate-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/30" }`}>
            {loading ? "Verifying…" : "Access Dashboard"}
          </button>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700">
            <button type="button" onClick={() => navigate("/register")} className="text-sm text-white hover:text-white">
              Register New Account
            </button>

            <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
      <div className="absolute bottom-6 text-center text-xs text-slate-600">
        Authorized Personnel Only • Secure Channel
      </div>
    </div>
  );
}
