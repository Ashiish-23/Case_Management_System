import "../styles/modal.css";

export default function EvidenceActionModal({data,close}){

  return(
    <div className="modal">
      <div className="modal-box">

        <h3>Evidence Actions</h3>

        <p><b>ID:</b> {data.evidence_code}</p>
        <p><b>Description:</b> {data.description}</p>

        <hr/>

        <button className="secondary-btn">
          Transfer Evidence (Coming Soon)
        </button>

        <button className="secondary-btn">
          Receive Evidence (Coming Soon)
        </button>

        <div className="modal-actions">
          <button onClick={close}>Close</button>
        </div>

      </div>
    </div>
  );
}