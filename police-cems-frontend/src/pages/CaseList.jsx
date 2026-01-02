import "../styles/CaseTable.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CaseTable({ cases: initialCases = [] }) {

  const navigate = useNavigate();
  const [cases, setCases] = useState(initialCases);

  // Sync with parent props
  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  // Fetch directly from backend once
  useEffect(() => {

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/cases", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(async res => {

        if (!res.ok) {

          if (res.status === 401 || res.status === 403) {
            console.warn("Unauthorized fetching cases");
            return null;
          }

          const text = await res.text();
          console.error("Cases API Error:", text);
          return null;
        }

        return res.json();
      })
      .then(data => {
        if (data) setCases(data);
      })
      .catch(err => console.error(err));

  }, []);

  const sortedCases = [...cases].sort(
    (a, b) => new Date(b.registered_date) - new Date(a.registered_date)
  );

  return (
    <div className="case-table-wrapper">

      <div className="case-table-title">
        Registered Cases
      </div>

      <div className="case-table-container">
        <table className="case-table">

          <thead>
            <tr>
              <th>Case Number</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Registered</th>
            </tr>
          </thead>

          <tbody>
            {sortedCases.map(c => (
              <tr
                key={c.id}
                onClick={() => navigate(`/case/${c.id}`)}
              >
                <td className="case-number">{c.case_number}</td>
                <td>{c.case_title}</td>
                <td><span className="case-category">{c.case_type}</span></td>

                <td>
                  <span className={`case-status ${c.status.toLowerCase()}`}>
                    {c.status}
                  </span>
                </td>
              
                <td>
                  {new Date(c.registered_date).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}
