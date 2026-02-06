// Top navigation bar with user actions and shortcuts.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Dashboard from "../pages/dashboard";

export default function Topbar() {
  const navigate = useNavigate();

  const [showActions, setShowActions] = useState(false);
  const [showUser, setShowUser] = useState(false);
  /* ============================
     GET USER FROM JWT
  ============================ */
  let user = { name: "Officer", role: "POLICE" };

  try {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      user.name = decoded.name || "Officer";
      user.role = decoded.role || "POLICE";
    }
  } catch (err) {
    console.error(err);
  }

  /* ============================
     ACTIONS
  ============================ */
  const logout = () => {
    const confirm = window.confirm("Are you sure you want to logout?");
    if (!confirm) return;

    localStorage.clear();
    navigate("/login");
  };

  const changePassword = () => {
    const confirm = window.confirm(
      "You will be redirected to change your password. Continue?"
    );
    if (!confirm) return;

    navigate("/change-password");
  };

  return (
    <>
      {/* TOPBAR */}
      <header className="h-14 w-full flex items-center justify-between px-6 bg-slate-900 border-b border-slate-700/60">

        {/* LEFT */}
        <div className="flex items-center gap-3 text-white font-bold">
          <div onClick={() => navigate("/dashboard")} className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            👮
          </div>
          <span onClick={() => navigate("/dashboard")} className="tracking-wide">POLICE CEMS</span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* ACTIONS */}
          <button
            onClick={() => {
              setShowActions(!showActions);
              setShowUser(false);
            }}
            className="text-xl text-white hover:text-white"
          > ☰ </button>

          {/* USER */}
          <button
            onClick={() => {
              setShowUser(!showUser);
              setShowActions(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold"
          >
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
            👮
          </div>
          </button>
        </div>
      </header>

      {/* ACTIONS MODAL */}
      {showActions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowActions(false)}
          />

          <div className="fixed top-16 right-6 z-50 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-3">
            <p className="text-xs text-white uppercase tracking-widest">
              Actions
            </p>

            <button
              onClick={() => navigate("/cases/create")}
              className="w-full text-left px-3 py-2 rounded hover:bg-blue-600"
            >
              ➕ Create Case
            </button>

            <button className="w-full text-left px-3 py-2 rounded opacity-50 cursor-not-allowed">
              🔗 Blockchain </button>
          </div>
        </>
      )}

      {/* USER MODAL */}
      {showUser && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUser(false)}
          />

          <div className="fixed top-16 right-6 z-50 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-3">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-white">{user.role}</p>
            </div>

            <button
              onClick={changePassword}
              className="w-full text-left px-3 py-2 rounded hover:bg-slate-700"
            >
              🔑 Change Password
            </button>

            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 rounded text-red-400 hover:bg-red-600 hover:text-white"
            >
              🚪 Logout
            </button>
          </div>
        </>
      )}
    </>
  );
}
