import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/* ================= SECURITY HELPERS ================= */
function sanitize(v) {
  return String(v || "").trim();
}

function strongPassword(p) {
  return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(p);
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
export default function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= TOKEN GUARD ================= */
  if (!token || token.length < 20) {
    return (
      <div className="flex items-center justify-center bg-slate-900 text-white">
        Invalid or expired reset link
      </div>
    );
  }

  /* ================= SUBMIT ================= */
  const submit = async e => {
    e.preventDefault();

    if (loading) return;

    const cleanPassword = sanitize(password);
    const cleanConfirm = sanitize(confirmPassword);

    if (cleanPassword !== cleanConfirm) {
      alert("Passwords do not match");
      return;
    }

    if (!strongPassword(cleanPassword)) {
      alert(
        "Password must contain:\n" +
        "• 8+ characters\n" +
        "• Uppercase letter\n" +
        "• Lowercase letter\n" +
        "• Number"
      );
      return;
    }
    setLoading(true);

    try {
      const res = await secureFetch(
        "http://localhost:5000/api/password/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword: cleanPassword
          })
        }
      );

      if (res.ok) {
        alert("Password updated successfully");
        navigate("/login", { replace: true });
      } else {
        alert("Invalid or expired reset link");
      }
    } catch (err) {

      if (err.name === "AbortError") {
        alert("Request timeout. Try again.");
      } else {
        alert("Reset failed. Try later.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  return (
    <div className="bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
        </div>
        <form className="space-y-6" onSubmit={submit}>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)}
              required className={inputStyle} />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-300 hover:text-white"
              aria-label="Toggle password visibility" >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="relative">
            <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} required className={inputStyle} />
            <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
              className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-300 hover:text-white"
              aria-label="Toggle password visibility" >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button disabled={loading} className="w-full bg-blue-600 py-3 rounded text-white disabled:opacity-50" >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
