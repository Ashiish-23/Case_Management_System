export default function Topbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div>Welcome, {user?.name || "Officer"}</div>
      <button onClick={onLogout}>Logout</button>
    </header>
  );
}
