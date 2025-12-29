import "./CaseForm.css";

export default function CreateEvidence() {
  return (
    <div className="layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">POLICE EMS</div>

        <nav>
          <a>Dashboard</a>
          <a>Manage Locations</a>
          <a>Case & Evidence</a>
          <a>Stock Report</a>
          <a>Data Entry Report</a>
          <a>Blockchain</a>
          <a>Manage Staff</a>
          <a>System Settings</a>
          <a className="logout">Logout</a>
        </nav>
      </aside>


      {/* Main Content */}
      <main className="content">

        <h2 className="page-title">Case & Evidence Entry</h2>

        <form className="form-panel">

          {/* Officer Section */}
          <h3>Officer Details</h3>
          <div className="grid">
            <input placeholder="Officer Name" required />
            <input placeholder="Police ID" required />
            <input placeholder="Email ID" type="email" />
          </div>


          {/* Case Section */}
          <h3>Case Details</h3>
          <div className="grid">
            <input placeholder="Case Number" required />
            <input placeholder="Station Name" />
            <input placeholder="Case Type (Theft, NDPS, Cyber etc)" />
          </div>


          {/* Seizure Section */}
          <h3>Seizure Details</h3>
          <div className="grid">
            <input placeholder="Seizure Location" />
            <input placeholder="Seized From (Person/Firm)" />
            <input placeholder="Date of Seizure" type="date" />
          </div>


          {/* Evidence Section */}
          <h3>Evidence Details</h3>
          <div className="grid">
            <input placeholder="Evidence Name" required />
            <select>
              <option>Select Evidence Category</option>
              <option>Electronics</option>
              <option>Narcotics</option>
              <option>Documents</option>
              <option>Money</option>
              <option>Weapons</option>
              <option>Other</option>
            </select>
            <input placeholder="Quantity" type="number" />
          </div>


          {/* Storage Section */}
          <h3>Storage Details</h3>
          <div className="grid">
            <select>
              <option>Select Rack</option>
              <option>Rack A</option>
              <option>Rack B</option>
            </select>

            <input placeholder="Box Number" />
            <input placeholder="Estimated Value (₹)" type="number" />
          </div>


          {/* Files */}
          <h3>Attach Files</h3>
          <input type="file" />


          {/* Submit */}
          <button className="submit-btn">Submit</button>

        </form>

      </main>
    </div>
  );
}
