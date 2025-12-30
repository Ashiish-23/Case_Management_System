import "../styles/CaseTable.css";
import { useNavigate } from "react-router-dom";

export default function CaseTable({ cases = [] }) {

  const navigate = useNavigate();

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
              <th>Status</th>
              <th>Registered</th>
            </tr>
          </thead>

          <tbody>
            {cases.map(c => (
              <tr 
                key={c.id}
                onClick={() => navigate(`/case/${c.id}`)}
              >
                <td className="case-number">{c.case_number}</td>
                <td>{c.case_title}</td>

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
