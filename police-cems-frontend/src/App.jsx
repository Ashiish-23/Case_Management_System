import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/landing";
import Register from "./pages/register";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgotpassword";
import ResetPassword from "./pages/resetpassword";
import Dashboard from "./pages/dashboard";
import CreateCase from "./pages/CreateCases";
import CaseDetail from "./pages/CaseDetail";

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
      </Routes>
    </BrowserRouter>
  );
}
