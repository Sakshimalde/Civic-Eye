import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Import all your page components
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import IssuesBrowser from "./pages/IssuesBrowser";
import VolunteerBrowserIssues from "./pages/VolunteerBrowserIssues";
import ReportIssuePage from "./pages/ReportIssuePage";
import Help from "./pages/Help";
import About from "./pages/About";
import Volunteer from "./pages/Volunteer";
import MyAssignedIssues from "./pages/MyAssignedIssues";
import VolunteerProfile from "./pages/VolunteerProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAllIssues from "./pages/AdminAllIssues";
import AdminUsersVolunteers from "./pages/AdminUsersVolunteers";
import AdminRequests from "./pages/AdminRequests";
import AdminIssuesUpdates from "./pages/AdminIssuesUpdates";
import AdminProfile from "./pages/AdminProfile";
import EditProfile from "./pages/EditProfile";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/browse-issues" element={<IssuesBrowser />} />
          <Route path="/report-issue" element={<ReportIssuePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          
          {/* Volunteer Routes */}
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/volunteer-browser-issues" element={<VolunteerBrowserIssues />} />
          <Route path="/MyAssignedIssues" element={<MyAssignedIssues />} />
          <Route path="/volunteer-profile" element={<VolunteerProfile />} />
          <Route path="/edit-volunteer-profile" element={<EditProfile />} />
          
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Dashboard />} />
<Route path="/AdminProfile" element={<AdminProfile />} />
          <Route path="/edit-admin-profile" element={<EditProfile />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-all-issues" element={<AdminAllIssues />} />
          <Route path="/admin-users-volunteers" element={<AdminUsersVolunteers />} />
          <Route path="/admin-requests" element={<AdminRequests />} />
          <Route path="/admin-issues-updates" element={<AdminIssuesUpdates />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;


