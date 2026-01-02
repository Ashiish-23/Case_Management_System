import "../styles/modal.css";

export default function EvidenceModal({ data, close }) {

  if (!data) return null;

  return (
    <div className="modal-overlay">

      <div className="modal-box">

        {/* Close Button */}
        <button className="modal-close" onClick={close}>✖</button>

        <h3>Evidence Details</h3>

        <div className="modal-section">
          <label>Evidence ID</label>
          <p>{data.evidence_code}</p>
        </div>

        <div className="modal-section">
          <label>Description</label>
          <p>{data.description}</p>
        </div>

        <div className="modal-section">
          <label>Category</label>
          <p>{data.category || "-"}</p>
        </div>

        <div className="modal-section">
          <label>Logged By</label>
          <p>{data.logged_by || "Officer"}</p>
        </div>

        <div className="modal-section">
          <label>Date Logged</label>
          <p>{new Date(data.logged_at).toLocaleString()}</p>
        </div>

        {data.image_url && (
          <div className="modal-section">
            <label>Attached Image</label>
            <img 
              src={`http://localhost:5000${data.image_url}`}
              alt="Evidence"
              className="evidence-img"
            />
          </div>
        )}

        <div className="modal-actions">
          <button onClick={close} className="primary-btn">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
