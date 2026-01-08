import { useState } from "react";
import "../styles/modal.css";

export default function CaseStatusModal({caseId,currentStatus,onClose}){

  const [reason,setReason] = useState("");
  const [ref,setRef] = useState("");

  const token = localStorage.getItem("token");


  /* ---- CLOSE ---- */
  const closeCase = async () => {
    const res = await fetch("http://localhost:5000/api/cases/close",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+token
      },
      body: JSON.stringify({
        caseId,
        reason,
        authority_reference: ref
      })
    });

    if(res.ok){
      onClose();
      window.location.reload();
    }
  };


  /* ---- RE-OPEN ---- */
  const reopenCase = async () => {
    const res = await fetch(`http://localhost:5000/api/cases/${caseId}/reopen`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+token
      },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();
    console.log(data);
    
    if(res.ok){
        onClose();
        window.location.reload();
      } else {
        alert(data.error || "Re-open failed");
      }
    };

  return(
    <div className="modal">

      <div className="modal-box">

        <h3>Case Status — {currentStatus}</h3>


        {(currentStatus === "OPEN" || currentStatus === "REOPENED") && (

          <>
            <label>Reason for Closure</label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} />

            <label>Authority Reference</label>
            <input value={ref} onChange={e=>setRef(e.target.value)} />

            <div className="modal-actions">
              <button onClick={onClose}>Cancel</button>

              <button 
                className="danger-btn"
                disabled={!reason || !ref}
                onClick={closeCase}
              >
                Close Case
              </button>
            </div>
          </>
        )}



        {currentStatus === "CLOSED" && (
          <>
            <label>Reason for Re-Opening</label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} />

            <div className="modal-actions">
              <button onClick={onClose}>Cancel</button>

              <button 
                className="primary-btn"
                disabled={!reason}
                onClick={reopenCase}
              >
                Re-Open Case
              </button>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
