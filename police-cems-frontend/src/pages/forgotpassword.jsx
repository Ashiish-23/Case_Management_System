import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import "../styles/Auth.css"; // Deleted

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

  // Reusable Input Style (Matches Login/Register)
  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    // Main Container (Full Screen, Dark Background)
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience (Subtle Glows) */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Auth Card (Glass Effect) */}
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600 shadow-lg shadow-black/20">
             {/* Key/Lock Icon for Password Reset */}
             <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Account Recovery</h2>
          <p className="text-white text-sm mt-2">Reset access securely</p>
        </div>

        {/* Form Section */}
        <form className="space-y-6" onSubmit={submit}>
          
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wider">
              Registered Email
            </label>
            <input 
              type="email" 
              placeholder="officer@police.gov.in" 
              onChange={e => setEmail(e.target.value)} 
              required 
              className={inputStyle}
            />
          </div>

          <button 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Send Reset Link
          </button>

          {/* Back Button */}
          <button 
            type="button" 
            onClick={() => navigate("/login")}
            className="w-full text-white hover:text-white text-sm py-2 transition-colors flex items-center justify-center gap-2"
          >
            &larr; Return to Login
          </button>

        </form>

        {/* Footer Warning */}
        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <p className="text-xs text-white">
            A secure reset link will be sent to your official email.
          </p>
        </div>

      </div>
    </div>
  );
}