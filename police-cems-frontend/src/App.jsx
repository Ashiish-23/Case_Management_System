import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/landing";
import Register from "./pages/register";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgotpassword";
import ResetPassword from "./pages/resetpassword";
import Dashboard from "./pages/dashboard";
import CreateCase from "./pages/CreateCases";
import CaseDetail from "./pages/CaseDetail";
import TransferHistory from "./pages/TransferHistory";
import Layout from "./components/Layout";

/* ================= TOKEN CHECK ================= */

function isTokenValid() {
  const token = sessionStorage.getItem("token");
  return !!token;
}

/* ================= PROTECTED ROUTE ================= */

function ProtectedRoute({ children }) {
  if (!isTokenValid()) {
    sessionStorage.clear();
    return <Navigate to="/login" replace />;
  }
  return children;
}

/* ================= PUBLIC ROUTE ================= */

function PublicOnlyRoute({ children }) {
  if (isTokenValid()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

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
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/cases/create" element={
          <ProtectedRoute>
            <Layout>
              <CreateCase />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/case/:id" element={
          <ProtectedRoute>
            <Layout>
              <CaseDetail />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/transfers/history/:evidenceId" element={
          <ProtectedRoute>
            <Layout>
              <TransferHistory />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
