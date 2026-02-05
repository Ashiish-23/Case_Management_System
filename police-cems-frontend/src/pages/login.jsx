import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    loginId: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        
        if(data.user) {
            localStorage.setItem("userRole", data.user.role);
            localStorage.setItem("userId", data.user.id);
        }

        navigate("/dashboard");
      } else {
        alert(data.message || "Invalid Credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error. Please try again.");
    }
  };

  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-blue-900   flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-sm w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-sm">
        
        

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600 shadow-lg shadow-black/20">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Login</h2>
          <p className="text-white text-sm mt-2">Police Evidence Management</p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wider">Officer ID <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
            <input 
              name="loginId" 
              placeholder="Enter Badge Number" 
              onChange={handleChange} 
              required 
              className={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wider">Secure Password <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter Password" 
                onChange={handleChange} 
                required 
                className={`${inputStyle} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 px-4 text-slate-300 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            type="submit"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            Access Dashboard
          </button>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700">
             <button 
               type="button" 
               onClick={() => navigate("/register")}
               className="text-sm text-white hover:text-white transition-colors"
             >
               Register New Account
             </button>
             
             {/* Fixed: Added Link to Forgot Password page */}
             <Link 
               to="/forgot-password" 
               className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
             >
               Forgot Password?
             </Link>
          </div>

        </form>
      </div>

      <div className="absolute bottom-6 text-center text-xs text-slate-600">
        Authorized Personnel Only • Secure Connection (TLS 1.3)
      </div>

    </div>
  );
}
