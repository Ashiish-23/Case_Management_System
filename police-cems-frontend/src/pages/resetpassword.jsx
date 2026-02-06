// Reset password page: apply token + new password.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  // Keeps your exact token logic
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

  // Reusable Input Style (Matches Login/Register)
  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    // Main Container (Full Screen, Dark Background)
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience (Subtle Glows) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Auth Card (Glass Effect) */}
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600 shadow-lg shadow-black/20">
             {/* Key Icon */}
             <span className="text-3xl">🔑</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-white text-sm mt-2">Create a new secure password</p>
        </div>

        {/* Form Section */}
        <form className="space-y-6" onSubmit={submit}>
          
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              onChange={e => setPassword(e.target.value)}
              required
              className={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className={inputStyle}
            />
          </div>

          <button 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Update Password
          </button>

        </form>

      </div>
    </div>
  );
}
