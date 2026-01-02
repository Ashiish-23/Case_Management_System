import { useState } from "react";
import "../styles/modal.css";

export default function AddEvidenceModal({ caseId, onClose, onAdded }) {

  const [description,setDescription] = useState("");
  const [category,setCategory] = useState("");
  const [image,setImage] = useState(null);

  const submit = async e => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const form = new FormData();
    form.append("caseId", caseId);
    form.append("description", description);
    form.append("category", category);
    if(image) form.append("image", image);

    await fetch("http://localhost:5000/api/evidence/add",{
      method:"POST",
      headers:{ Authorization:"Bearer "+token },
      body: form
    });

    onAdded();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        <h2 className="modal-title">Add Evidence</h2>

        <form onSubmit={submit} className="modal-form">

          <label>Description</label>
          <textarea 
            value={description} 
            onChange={e=>setDescription(e.target.value)} 
            required
          />

          <label>Category</label>
          <input 
            value={category} 
            onChange={e=>setCategory(e.target.value)} 
            placeholder="Example: Weapon / Narcotics / Digital Asset"
          />

          <label>Upload Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={e=>setImage(e.target.files[0])} 
          />

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save Evidence</button>
          </div>

        </form>

      </div>
    </div>
  );
}
