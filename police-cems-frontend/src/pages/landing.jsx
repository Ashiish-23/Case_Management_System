import { Link } from "react-router-dom";

export default function Landing() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  return (
    // Main Wrapper
    <div className="min-h-screen bg-blue-900 text-slate-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      
      {/* BACKGROUND ACCENTS */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 w-full px-8 py-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="bg-slate-900 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs font-bold tracking-widest">
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
                className="text-blue-400 hover:text-white font-medium px-4 py-2 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="text-blue-400 hover:text-white font-medium px-4 py-2 transition-colors rounded-lg transition-all" 
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 pt-20 pb-10">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Digital Chain of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Custody</span>
          </h2>
          
          <p className="inline-block bg-blue-800/40 text-blue-200 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-700/50">
            Secure • Tamper-Evident • Court-Admissible
          </p>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A centralized, high-security Case & Evidence Management System
            designed exclusively for law-enforcement agencies.
            Every action is logged, verified, and preserved.
          </p>

          <div className="pt-8 mb-16">
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
                className="bg-blue-600 text-white hover:bg-blue-700 text-lg font-bold py-4 px-10 rounded-xl shadow-xl shadow-blue-900/20 transition-all hover:scale-105 inline-block"
              >
                Access Secure Portal
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* FEATURES SECTION (Seamless - No Border) */}
      <section className="relative z-10 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="bg-blue-800/40 border border-blue-700/30 p-6 rounded-2xl hover:bg-blue-800/60 transition-colors">
            <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center text-2xl mb-4 text-blue-200">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">High-Assurance Security</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Role-based access, cryptographic hashing, and strict audit controls protect all case data from unauthorized access.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-blue-800/40 border border-blue-700/30 p-6 rounded-2xl hover:bg-blue-800/60 transition-colors">
            <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center text-2xl mb-4 text-blue-200">🧾</div>
            <h3 className="text-xl font-bold text-white mb-2">Immutable Evidence Logs</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Every evidence movement is recorded with hash chaining, creating a tamper-evident chain of custody.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-blue-800/40 border border-blue-700/30 p-6 rounded-2xl hover:bg-blue-800/60 transition-colors">
            <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center text-2xl mb-4 text-blue-200">⚖️</div>
            <h3 className="text-xl font-bold text-white mb-2">Court-Ready Reports</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Generate standardized, legally compliant reports with full movement history and officer accountability.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-blue-800/30 bg-slate-900/50 py-8 text-center">
        <p className="text-slate-400 text-sm">
          © {new Date().getFullYear()} Police Department • <span className="text-slate-500">Authorized Personnel Only</span>
        </p>
      </footer>

    </div>
  );
}