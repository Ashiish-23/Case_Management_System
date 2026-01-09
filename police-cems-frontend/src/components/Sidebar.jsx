import { useNavigate, Link } from "react-router-dom";

export default function Sidebar() {

  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    // Main Sidebar Container (Full Height, Dark Background, Border Right)
    <aside className="h-full flex flex-col bg-slate-900 border-r border-slate-700/50 text-slate-300">

      {/* 1. Logo Section */}
      <div className="p-6 border-b border-slate-800">
        <Link 
          to="/dashboard" 
          className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity"
        >
          {/* Badge Icon */}
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-500/50">
            <span className="text-sm">👮‍♂️</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wide uppercase">Police CEMS</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Secure Portal</span>
          </div>
        </Link>
      </div>

      {/* 2. Scrollable Menu Area */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">

        {/* Menu Group */}
        <nav>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-3">
            Case & Evidence
          </div>

          <ul className="space-y-2">
            
            {/* Create Case Button */}
            <li 
              onClick={() => navigate("/cases/create")}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-900/20 active:scale-95"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">➕</span>
              <span className="font-medium">Register New Case</span>
            </li>
          </ul>
        </nav>

      </div>

      {/* 3. Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button 
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-300" 
          onClick={logout}
        >
          <span>🚪</span> Logout
        </button>
        
        <p className="text-center text-[10px] text-slate-600 mt-4">
          v1.0.4 • Encrypted Connection
        </p>
      </div>

    </aside>
  );
}