export default function Topbar({ onLogout }) {
  return (
    <header className="topbar">
      <div></div>
      <button  onClick={onLogout}>Logout</button>
    </header>
  );
}
