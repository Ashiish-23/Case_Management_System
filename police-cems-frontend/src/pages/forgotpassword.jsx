import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ================= SECURITY HELPERS ================= */

function sanitize(v) {
  return String(v || "")
    .trim()
    .replace(/[<>]/g, "");
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async e => {

    e.preventDefault();

    if (loading) return;

    const cleanEmail = sanitize(email).toLowerCase();

    if (!validEmail(cleanEmail)) {
      alert("Enter valid email address");
      return;
    }

    setLoading(true);

    try {

      const res = await secureFetch(
        "http://localhost:5000/api/password/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail })
        }
      );

      /* SECURITY: Do NOT expose if email exists */
      if (res.ok) {
        alert(
          "If the email exists in our system, a reset link has been sent."
        );
        navigate("/login");
      } else {
        alert("Request processed. Check your email.");
      }

    } catch (err) {

      if (err.name === "AbortError") {
        alert("Request timeout. Try again.");
      } else {
        alert("Request failed. Try again later.");
      }

    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  const inputStyle =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">

      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Account Recovery</h2>
        </div>

        <form className="space-y-6" onSubmit={submit}>

          <input
            type="email"
            placeholder="officer@police.gov.in"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputStyle}
          />

          <button
            disabled={loading}
            className="w-full bg-blue-600 py-3 rounded text-white"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full text-white text-sm"
          >
            ← Return to Login
          </button>

        </form>

      </div>
    </div>
  );
}
