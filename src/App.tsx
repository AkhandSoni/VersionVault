
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentPage from "./pages/DocumentPage";
import BranchPage from "./pages/BranchPage";
import ActivityPage from "./pages/ActivityPage";
import VersionComparePage from "./pages/VersionComparePage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Documents */}
        <Route path="/documents" element={<DocumentPage />} />
        <Route path="/documents/:id" element={<DocumentPage />} />

        {/* Other Pages */}
        <Route path="/branches" element={<BranchPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/compare" element={<VersionComparePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

