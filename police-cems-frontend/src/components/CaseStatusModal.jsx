import { useState } from "react";
import "../styles/modal.css";

export default function CaseStatusModal({caseId,currentStatus,onClose}){

  const [reason,setReason] = useState("");
  const [ref,setRef] = useState("");

  const submit = async ()=>{
    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:5000/api/cases/${caseId}/close`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          Authorization:"Bearer "+token
        },
        body: JSON.stringify({
          reason,
          authority_reference:ref
        })
      }
    );

    const data = await res.json();
    alert(data.message);
    window.location.reload();
  };


  return(
    <div className="modal">
      <div className="modal-box">

        <h3>Case Status — {currentStatus}</h3>

        {currentStatus === "OPEN" ? (
          <>
            <label>Reason for Closure</label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)}/>

            <label>Authority Reference</label>
            <input value={ref} onChange={e=>setRef(e.target.value)}/>

            <div className="modal-actions">
              <button onClick={onClose}>Cancel</button>
              <button className="danger-btn" onClick={submit}>
                Close Case
              </button>
            </div>
          </>
        ) : (
          <p>Re-open Coming Soon</p>
        )}

      </div>
    </div>
  );
}
