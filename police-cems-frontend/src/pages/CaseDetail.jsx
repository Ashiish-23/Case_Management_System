import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AddEvidenceModal from "../components/AddEvidenceModal";
import Sidebar from "../components/Sidebar";

import "../styles/CaseDetail.css";

export default function CaseDetail(){

  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData,setCaseData] = useState(null);
  const [evidence,setEvidence] = useState([]);
  const [showAddModal,setShowAddModal] = useState(false);


  // ---------- LOAD DATA ----------
  const loadData = useCallback(()=>{

    const token = localStorage.getItem("token");

    // CASE DETAILS
    fetch(`http://localhost:5000/api/cases/${id}`,{
      headers:{ "Authorization":"Bearer "+token }
    })
    .then(res=>res.json())
    .then(setCaseData);

    // EVIDENCE LIST
    fetch(`http://localhost:5000/api/evidence/case/${id}`,{
      headers:{ "Authorization":"Bearer "+token }
    })
    .then(res=>res.json())
    .then(setEvidence);
  }, [id]);


  useEffect(()=>{
    loadData();
  },[loadData]);


  if(!caseData) return <p>Loading case…</p>;


  return(
    <div className="layout">

      <Sidebar/>

      <div className="main">

        {/* HEADER */}
        <div className="case-header">

          <button className="back-btn" onClick={()=>navigate("/dashboard")}>
            ⬅ Back
          </button>

          <h2>{caseData.case_number}</h2>

          <p className="case-title">{caseData.case_title}</p>

          <span className={`case-status ${caseData.status.toLowerCase()}`}>
            {caseData.status}
          </span>
        </div>


        {/* --------- EVIDENCE SECTION ---------- */}
        <div className="section">

          <div className="section-header">
            <h3>Evidence</h3>

            <button 
              className="primary-btn"
              onClick={()=>setShowAddModal(true)}
            >
              + Add Evidence
            </button>
          </div>


          <table className="evidence-table">

            <thead>
              <tr>
                <th>Evidence ID</th>
                <th>Description</th>
                <th>Category</th>
                <th>Logged By</th>
                <th>Date</th>
              </tr>
            </thead>


            <tbody>
              {evidence.map(e=>(
                <tr key={e.id}>
                  <td>{e.evidence_code}</td>
                  <td>{e.description}</td>
                  <td>{e.category ?? "-"}</td>
                  <td>{e.officer_name ?? "Unknown"}</td>
                  <td>{new Date(e.logged_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </div>


      {/* --------- ADD MODAL ---------- */}
      {showAddModal && 
        <AddEvidenceModal
          caseId={id}
          onClose={()=>setShowAddModal(false)}
          onAdded={()=>loadData()}
        />
      }

    </div>
  );
}
