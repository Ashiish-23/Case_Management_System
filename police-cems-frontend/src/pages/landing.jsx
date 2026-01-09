import { Link } from "react-router-dom";
// import "../styles/landing.css"; // Deleted: No longer needed

export default function Landing() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    // Main Wrapper: Full screen height, flex column to push footer down
    <div className="min-h-screen bg-blue-900 text-slate-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      
      {/* BACKGROUND ACCENTS (Subtle Glows) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 w-full px-8 py-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Badge Style */}
          <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs font-bold tracking-widest">
            POLICE
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Evidence Vault</h1>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden md:block text-slate-400 text-sm">
                Officer: <span className="text-white font-medium">{user.name}</span>
              </span>
              <Link 
                to="/dashboard" 
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-slate-400 hover:text-white font-medium px-4 py-2 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-medium py-2 px-5 rounded-lg transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION (Flex-Grow pushes footer down) */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Digital Chain of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Custody</span>
          </h2>
          
          <p className="inline-block bg-slate-800/50 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium border border-slate-700/50">
            Secure • Tamper-Evident • Court-Admissible
          </p>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A centralized, high-security Case & Evidence Management System
            designed exclusively for law-enforcement agencies.
            Every action is logged, verified, and preserved.
          </p>

          <div className="pt-8">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-lg font-bold py-4 px-10 rounded-xl shadow-xl shadow-blue-900/50 transition-all hover:scale-105 inline-block"
              >
                Go to Console
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-white text-slate-900 hover:bg-blue-100 text-lg font-bold py-4 px-10 rounded-xl shadow-xl shadow-white/10 transition-all hover:scale-105 inline-block"
              >
                Access Secure Portal
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* FEATURES SECTION */}
      <section className="relative z-10 bg-blue-800/30 border-t border-blue-800 py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="bg-blue-800/50 border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/30 transition-colors">
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center text-2xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">High-Assurance Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Role-based access, cryptographic hashing, and strict audit controls protect all case data from unauthorized access.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-blue-800/50 border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/30 transition-colors">
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center text-2xl mb-4">🧾</div>
            <h3 className="text-xl font-bold text-white mb-2">Immutable Evidence Logs</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every evidence movement is recorded with hash chaining, creating a tamper-evident chain of custody.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-blue-800/50 border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/30 transition-colors">
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center text-2xl mb-4">⚖️</div>
            <h3 className="text-xl font-bold text-white mb-2">Court-Ready Reports</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate standardized, legally compliant reports with full movement history and officer accountability.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER (Stays at bottom) */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-900 py-8 text-center">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Police Department • <span className="text-slate-400">Authorized Personnel Only</span>
        </p>
      </footer>

    </div>
  );
}