import { Link } from "react-router-dom";
import "../styles/landing.css";

export default function Landing() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <>
      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-left">
          <span className="badge">POLICE</span>
          <h1 className="brand">Evidence Vault</h1>
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <span className="welcome">Officer: {user.name}</span>
              <Link to="/dashboard" className="btn primary">Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost">Login</Link>
              <Link to="/register" className="btn primary">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <h2>Digital Chain of Custody</h2>
          <p className="hero-tag">
            Secure • Tamper-Evident • Court-Admissible
          </p>

          <p className="hero-desc">
            A centralized, high-security Case & Evidence Management System
            designed exclusively for law-enforcement agencies.
            Every action is logged, verified, and preserved.
          </p>

          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="btn primary large">
                Go to Console
              </Link>
            ) : (
              <Link to="/login" className="btn primary large">
                Access Secure Portal
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="feature">
          <div className="icon">🔒</div>
          <h3>High-Assurance Security</h3>
          <p>
            Role-based access, cryptographic hashing, and strict audit controls
            protect all case data from unauthorized access or modification.
          </p>
        </div>

        <div className="feature">
          <div className="icon">🧾</div>
          <h3>Immutable Evidence Logs</h3>
          <p>
            Every evidence movement is recorded with hash chaining,
            creating a tamper-evident chain of custody suitable for court use.
          </p>
        </div>

        <div className="feature">
          <div className="icon">⚖️</div>
          <h3>Court-Ready Reports</h3>
          <p>
            Generate standardized, legally compliant reports with
            full movement history and officer accountability.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Police Department • Authorized Personnel Only
        </p>
      </footer>
    </>
  );
}
