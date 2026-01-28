import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/landing";
import Register from "./pages/register";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgotpassword";
import ResetPassword from "./pages/resetpassword";
import Dashboard from "./pages/dashboard";
import CreateCase from "./pages/CreateCases";
import CaseDetail from "./pages/CaseDetail";
import Topbar from "./components/Topbar";
import Transfers from "./pages/Transfers";
import TransferModal from "./components/TransferModal";
import TransferHistory from "./pages/TransferHistory";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases/create" element={<CreateCase />} />
        <Route path="/case/:id" element={<CaseDetail />} />
        <Route path="/topbar" element={<Topbar />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/transfers/new/:evidenceId" element={<TransferModal />} />
        <Route path="/transfers/history/:evidenceId" element={<TransferHistory />} />
      </Routes>
    </BrowserRouter>
  );
}
