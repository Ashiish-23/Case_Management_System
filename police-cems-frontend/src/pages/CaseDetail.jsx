import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function CaseDetail(){

  const { id } = useParams();
  const [caseData,setCaseData] = useState(null);

  useEffect(()=>{

    const token = localStorage.getItem("token");

    fetch(`http://localhost:5000/api/cases/${id}`,{
      headers:{ "Authorization":"Bearer "+token }
    })
    .then(res=>res.json())
    .then(data=> setCaseData(data));

  },[id]);

  if(!caseData) return <p>Loading case…</p>;

  return(
    <div>
      <h2>{caseData.case_number}</h2>
      <p><b>Title:</b> {caseData.case_title}</p>
      <p><b>Status:</b> {caseData.status}</p>

      <hr/>

      <h3>Evidence Module — Coming Next</h3>
    </div>
  );
}
