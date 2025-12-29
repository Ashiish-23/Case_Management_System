import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreateCase.css";

export default function CreateCase(){

  const navigate = useNavigate();

  const [form,setForm] = useState({
    caseTitle:"",
    caseType:"",
    description:"",
    officerName:"",
    officerRank:"",
    stationName:"",
    firNumber:""
  });

  const change = e =>
    setForm({...form,[e.target.name]:e.target.value});

  const submit = async e =>{
    e.preventDefault();

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/cases/create",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+token
      },
      body:JSON.stringify(form)
    });

    const data = await res.json();

    if(res.ok){
      alert(`Case created successfully.\nCASE ID: ${data.caseNumber}`);
      navigate("/dashboard");
    }else{
      alert(data.error || "Failed to create case");
    }
  };

  return(
    <div className="case-page">

      <div className="case-header">
        <h1 style={{ textAlign: 'center' }}>Case Registration Form</h1>
        <p style={{ textAlign: 'center' }}>Please enter accurate case details as per departmental guidelines</p>
      </div>

      <form className="case-form" onSubmit={submit}>

        <label>Case Title</label>
        <input name="caseTitle" onChange={change} required />

        <label>Case Type</label>
        <select name="caseType" onChange={change} required>
          <option value="">Select Case Type</option>
          <option>Theft</option>
          <option>Cyber Crime</option>
          <option>Homicide</option>
          <option>Narcotics</option>
          <option>Financial Fraud</option>
        </select>

        <label>Case Description</label>
        <textarea name="description" rows="4" onChange={change} required />

        <label>Investigating Officer Name</label>
        <input name="officerName" onChange={change} required />

        <label>Officer Rank</label>
        <input name="officerRank" onChange={change} required />

        <label>Police Station Name</label>
        <input name="stationName" onChange={change} required />

        <label>FIR Number (Optional)</label>
        <input name="firNumber" onChange={change} />

        <div className="case-actions">
          <button type="button" className="secondary-btn" onClick={()=>navigate("/dashboard")}>
            Cancel
          </button>

          <button className="primary-btn" type="submit">
            Create Case
          </button>
        </div>

      </form>
    </div>
  );
}
