import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Layout({ children }) {

  const navigate = useNavigate();

  const [showActions, setShowActions] = useState(false);
  const [showUser, setShowUser] = useState(false);

  /* ================= GET USER FROM TOKEN ================= */

  let user = { name: "Officer", role: "POLICE" };

  try {
    const token = sessionStorage.getItem("token");

    if (token) {
      const decoded = jwtDecode(token);
      user.name = decoded.name || "Officer";
      user.role = decoded.role || "POLICE";
    }
  } catch {
    // silent fallback
  }

  /* ================= LOGOUT ================= */
  const logout = () => {

    if (!window.confirm("Are you sure you want to logout?")) return;

    sessionStorage.clear();
    navigate("/login");
  };

  const changePassword = () => {
    if(!window.confirm("You will be redirected to the password change page. Continue?")) return;
    navigate("/forgot-password");
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-900 text-slate-100">

      {/* ===== HEADER ===== */}

      <header className="h-20 pb-6 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-700 relative">

        {/* LEFT LOGO */}
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 text-white font-bold cursor-pointer"
        >
          <div className="w-12 h-10 bg-blue-600 rounded flex items-center justify-center">
            <img className="w-12 h-10 rounded" src="/src/assets/police logo.jpeg" alt="Police Department Logo" />
          </div>
          POLICE CEMS
        </div>

        {/* RIGHT BUTTONS */}

        <div className="flex items-center gap-4">

          {/* ACTIONS BUTTON */}

          <button
            onClick={() => {
              setShowActions(!showActions);
              setShowUser(false);
            }}
            className="text-xl text-white"
          >
            ☰
          </button>

          {/* USER BUTTON */}

          <button
            onClick={() => {
              setShowUser(!showUser);
              setShowActions(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"
          >
            👮
          </button>

        </div>

        {/* ===== ACTIONS MENU ===== */}

        {showActions && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowActions(false)}
            />

            <div className="absolute right-16 top-14 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 w-56">

              <button
                onClick={() => {
                  navigate("/cases/create");
                  setShowActions(false);
                }}
                className="block w-full text-left px-4 py-3 hover:bg-blue-600 rounded-t-xl"
              >
                ➕ Create Case
              </button>

              <button
                className="block w-full text-left px-4 py-3 opacity-50 cursor-not-allowed"
              >
                🔗 Blockchain
              </button>

            </div>
          </>
        )}

        {/* ===== USER MENU ===== */}

        {showUser && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUser(false)}
            />

            <div className="absolute right-4 top-14 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 w-56">

              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-white font-semibold">{user.name}</p>
                <p className="text-slate-400 text-sm">{user.role}</p>
              </div>

              <button
                onClick={changePassword}
                className="block w-full text-left px-4 py-3 hover:bg-slate-700"
              >
                🔑 Change Password
              </button>

              <button
                onClick={logout}
                className="block w-full text-left px-4 py-3 text-red-400 hover:bg-red-600 hover:text-white rounded-b-xl"
              >
                🚪 Logout
              </button>

            </div>
          </>
        )}

      </header>

      {/* ===== PAGE CONTENT ===== */}

      <main className="flex-1 pb-8">
        {children}
      </main>

      {/* ===== FOOTER ===== */}

      <footer className="border-t border-blue-800/30 bg-slate-900/60 py-6 text-center text-slate-400 text-sm">

        © {new Date().getFullYear()} Police Department • Authorized Personnel Only

      </footer>

    </div>
  );
}
