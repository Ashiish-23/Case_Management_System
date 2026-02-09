import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/landing";
import Register from "./pages/register";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgotpassword";
import ResetPassword from "./pages/resetpassword";
import Dashboard from "./pages/dashboard";
import CreateCase from "./pages/CreateCases";
import CaseDetail from "./pages/CaseDetail";
import Topbar from "./components/Topbar";
import TransferHistory from "./pages/TransferHistory";

/* ================= AUTH GUARD ================= */

function ProtectedRoute({ children }) {

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ================= PUBLIC ROUTE GUARD ================= */
/* Prevent logged-in users from opening login/register */

function PublicOnlyRoute({ children }) {

  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ================= APP ROUTING ================= */

export default function App() {

  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />

        <Route path="/register" element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        } />

        <Route path="/login" element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        } />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* PROTECTED */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/cases/create" element={
          <ProtectedRoute>
            <CreateCase />
          </ProtectedRoute>
        } />

        <Route path="/case/:id" element={
          <ProtectedRoute>
            <CaseDetail />
          </ProtectedRoute>
        } />

        <Route path="/transfers/history/:evidenceId" element={
          <ProtectedRoute>
            <TransferHistory />
          </ProtectedRoute>
        } />

        {/* OPTIONAL — REMOVE IF NOT NEEDED */}
        <Route path="/topbar" element={
          <ProtectedRoute>
            <Topbar />
          </ProtectedRoute>
        } />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
