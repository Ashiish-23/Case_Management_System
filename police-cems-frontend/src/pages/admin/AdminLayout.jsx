import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useMemo } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();

  /* ================= GET ADMIN INFO ================= */
  const admin = useMemo(() => {
    try {
      const token = sessionStorage.getItem("token");

      if (!token)
        return {
          name: "Administrator",
          role: "admin"
        };

      const decoded = jwtDecode(token);
      return {
        name: decoded.name || "Administrator",
        role: decoded.role || "admin"
      };
    }
    catch (err) {
      console.error("Admin token decode error:", err);
      return {
        name: "Administrator",
        role: "admin"
      };
    }
  }, []);

  /* ================= LOGOUT ================= */
  function logout() {

    if (!window.confirm("Logout from admin panel?"))
      return;

    sessionStorage.clear();
    navigate("/landing");
  }

  /* ================= NAVIGATION ITEMS ================= */
  const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Cases", path: "/admin/cases" },
    { name: "Evidence", path: "/admin/evidence" },
    { name: "Transfers", path: "/admin/transfers" },
    { name: "Stations", path: "/admin/stations" },
    { name: "Audit Logs", path: "/admin/audit" }  ];

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-blue-900 text-white flex flex-col">

      {/* ================= TOPBAR ================= */}
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LEFT */}
          <div
            onClick={() => navigate("/admin")}
            className="flex items-center gap-3 cursor-pointer">

            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold">
              🛡
            </div>

            <div>
              <div className="font-bold text-lg">
                Police CEMS
              </div>
              <div className="text-xs text-slate-400">
                Administrator Panel
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">
                {admin.name}
              </div>
              <div className="text-xs text-slate-400 uppercase">
                {admin.role}
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold"> Logout </button>
          </div>
        </div>
      </header>

      {/* ================= NAV BAR ================= */}
      <div className="bg-blue-800 border-b border-slate-700">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex gap-3 flex-wrap">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `px-5 py-2 rounded-lg font-medium transition-all border ${
                  isActive
                    ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20"
                    : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                }`} > {item.name} </NavLink>
          ))}
        </div>
      </div>

      {/* ================= PAGE CONTENT ================= */}
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900 border-t border-slate-700 text-center text-sm text-slate-400 py-4">
        © {new Date().getFullYear()} Police Department • Administrator Access
      </footer>
    </div>
  );
}
