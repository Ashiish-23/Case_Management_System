// Create evidence page (legacy/fullscreen form if used).
import { useState } from "react";
// import "../styles/modal.css"; // Deleted

export default function AddEvidenceModal({ caseId, onClose, onAdded }) {

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);

  const submit = async e => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const form = new FormData();
    form.append("caseId", caseId);
    form.append("description", description);
    form.append("category", category);
    if (image) form.append("image", image);

    await fetch("http://localhost:5000/api/evidence/add", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: form
    });

    onAdded();
    onClose();
  };

  // Reusable Input Style
  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    // Overlay: Fixed position, dark blur background
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      
      {/* Modal Box: Slate Theme, Rounded, Shadow */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Add New Evidence</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={submit} className="p-6 space-y-4">

          {/* Description Field */}
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase">Description <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className={`${inputStyle} h-24 resize-none`}
              placeholder="Describe the item securely..."
              required
            />
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase">Category <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
            <input 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              className={inputStyle}
              placeholder="e.g. Weapon, Narcotic, Document"
              required
            />
          </div>

          {/* File Upload Field (Styled specifically for Tailwind) */}
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase">Evidence Photo <span style={{ color: 'red', fontSize: '20px' }}>*</span> </label>
            <input 
              type="file" 
              onChange={e => setImage(e.target.files[0])} 
              className="block w-full text-sm text-white
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-blue-600 file:text-white
                file:cursor-pointer hover:file:bg-blue-500
                hover:file:cursor-pointer
              "
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-white hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-sm"
            >
              Add Evidence
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
