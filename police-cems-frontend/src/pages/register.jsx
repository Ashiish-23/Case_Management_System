import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const data = await res.json();
      if (data.emailSent === false) {
        alert(data.emailError || "Registration successful, but email failed to send.");
      } else {
        alert("Registration successful");
      }
      navigate("/login");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Registration failed");
    }
  };

  // Reusable styling for all input fields to keep code clean
  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    // Main Container (Full Screen, Dark Background)
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      
      {/* Auth Card (Glass Effect) */}
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden">

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
             <span className="text-3xl">👮</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Officer Registration</h2>
          <p className="text-white text-sm mt-2">Create an official police account</p>
        </div>

        {/* Form Section */}
        <form className="space-y-4" onSubmit={submit}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="name" 
              placeholder="Full Name" 
              onChange={handleChange} 
              required 
              className={inputStyle}
            />
            <input 
              name="loginId" 
              placeholder="Login ID (Badge No.)" 
              onChange={handleChange} 
              required 
              className={inputStyle}
            />
          </div>

          <input 
            name="email" 
            type="email" 
            placeholder="Official Email (@police.gov.in)" 
            onChange={handleChange} 
            required 
            className={inputStyle}
          />

          <div className="relative">
            <select 
              name="role" 
              onChange={handleChange} 
              required 
              className={`${inputStyle} appearance-none cursor-pointer`}
            >
              <option value="" className="bg-slate-900 text-white">Select Rank / Role</option>
              <option className="bg-slate-800">Constable</option>
              <option className="bg-slate-800">Head Constable</option>
              <option className="bg-slate-800">Sub-Inspector</option>
              <option className="bg-slate-800">Inspector</option>
              <option className="bg-slate-800">DSP</option>
              <option className="bg-slate-800">SP</option>
            </select>
            {/* Custom Arrow Icon for Select */}
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
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
            <div className="relative">
              <input 
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Confirm Password" 
                onChange={handleChange} 
                required 
                className={`${inputStyle} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(s => !s)}
                className="absolute inset-y-0 right-0 px-4 text-slate-300 hover:text-white"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 mt-6"
            type="submit"
          >
            Register Account
          </button>

          {/* Back Button */}
          <button 
            type="button" 
            onClick={() => navigate("/login")}
            className="w-full text-white hover:text-white text-sm py-2 transition-colors"
          >
            &larr; Return to Login
          </button>

        </form>

        {/* Footer Warning */}
        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <p className="text-xs text-white flex items-center justify-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Restricted access. Registration subject to approval.
          </p>
        </div>

      </div>
    </div>
  );
}
