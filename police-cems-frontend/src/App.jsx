import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

/* ================= PUBLIC PAGES ================= */
import Landing from "./pages/landing";
import Register from "./pages/register";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgotpassword";
import ResetPassword from "./pages/resetpassword";

/* ================= OFFICER PAGES ================= */
import Dashboard from "./pages/dashboard";
import CreateCase from "./pages/CreateCases";
import CaseDetail from "./pages/CaseDetail";
import TransferHistory from "./pages/TransferHistory";

/* ================= ADMIN PAGES ================= */
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCases from "./pages/admin/AdminCases";
import AdminEvidence from "./pages/admin/AdminEvidence";
import AdminTransfers from "./pages/admin/AdminTransfers";
import AdminStations from "./pages/admin/AdminStations";

/* ================= LAYOUT ================= */
import Layout from "./components/Layout";

/* ================= TOKEN VALIDATION ================= */
function isTokenValid() {
  const token = sessionStorage.getItem("token");
  if (!token)
    return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      sessionStorage.clear();
      return false;
    }
    return true;
  } catch (err) {
    console.error("Token validation error:", err);
    sessionStorage.clear();
    return false;
  }
} 

/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute() {
  if (!isTokenValid())
    return <Navigate to="/login" replace />;
  return <Outlet />;
}

/* ================= PUBLIC ONLY ROUTE ================= */
function PublicOnlyRoute() {
  if (isTokenValid())
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/* ================= APP ================= */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= OFFICER ROUTES ================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases/create" element={<CreateCase />} />
            <Route path="/case/:id" element={<CaseDetail />} />
            <Route path="/transfers/history/:evidenceId" element={<TransferHistory />} />
          </Route>
        </Route>

        {/* ================= ADMIN ROUTES ================= */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="cases" element={<AdminCases />} />
            <Route path="evidence" element={<AdminEvidence />} />
            <Route path="transfers" element={<AdminTransfers />} />
            <Route path="stations" element={<AdminStations />} />
          </Route>
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
