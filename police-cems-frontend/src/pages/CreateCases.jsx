// Create case form page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import "../styles/CreateCase.css"; // Deleted

export default function CreateCase() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    caseTitle: "",
    caseType: "",
    description: "",
    officerName: "",
    officerRank: "",
    stationName: "",
    firNumber: ""
  });

  const change = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/cases/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Case created successfully.\nCASE ID: ${data.caseNumber}`);
      navigate("/dashboard");
    } else {
      alert(data.error || "Failed to create case");
    }
  };

  // Shared Styles for Consistency
  const labelStyle = "block text-xs font-medium text-white mb-1 uppercase tracking-wider";
  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    // Main Background
    <div className="min-h-screen bg-blue-900 py-10 px-4 flex justify-center items-start">
      
      {/* Card Container */}
      <div className="max-w-4xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900/50 px-8 py-6 border-b border-slate-700 text-center relative">
          <h1 className="text-3xl font-bold text-white tracking-tight">Case Registration Form</h1>
          <p className="text-white text-sm mt-2">Please enter accurate case details as per departmental guidelines</p>
        </div>

        {/* Form Section */}
        <form className="p-8 space-y-6" onSubmit={submit}>

          {/* Row 1: Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Case Title <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
              <input 
                name="caseTitle" 
                onChange={e => change(e, e.target.value)} 
                required 
                className={inputStyle} 
                placeholder="e.g. Operation Bluebird"
              />
            </div>

            <div>
              <label className={labelStyle}>Case Type <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
              <div className="relative">
                <select 
                  name="caseType" 
                  onChange={e => change(e, e.target.value)} 
                  required 
                  className={`${inputStyle} appearance-none cursor-pointer`}
                >
                  <option value="" className="text-white">Select Case Type <span style={{ color: 'red', fontSize: '20px' }}>*</span> </option>
                  <option>Theft</option>
                  <option>Cyber Crime</option>
                  <option>Homicide</option>
                  <option>Narcotics</option>
                  <option>Financial Fraud</option>
                </select>
                {/* Arrow Icon */}
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Description (Full Width) */}
          <div>
            <label className={labelStyle}>Case Description <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
            <textarea 
              name="description" 
              rows="4" 
              onChange={e => change(e, e.target.value)} 
              required 
              className={`${inputStyle} resize-none`}
              placeholder="Detailed incident report..."
            />
          </div>

          {/* Row 3: Officer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <div className="md:col-span-2">
               <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Investigating Officer Details</h4>
            </div>
            <div>
              <label className={labelStyle}>Officer Name <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
              <input name="officerName" onChange={e => change(e, e.target.value)} required className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Officer Rank <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
              <input name="officerRank" onChange={e => change(e, e.target.value)} required className={inputStyle} />
            </div>
          </div>

          {/* Row 4: Station & FIR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Police Station Name <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
              <input name="stationName" onChange={e => change(e, e.target.value)} required className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>FIR Number <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
              <input name="firNumber" onChange={e => change(e, e.target.value)} className={inputStyle} required placeholder="e.g. FIR-2026-XXXX" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-700 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-lg border border-slate-600 text-white hover:text-white hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>

            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              Register Case
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
