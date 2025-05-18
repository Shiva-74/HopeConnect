import React from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom'; // Added Outlet
import './App.css'; // Main styles

// Common Components
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';

// Page Components
import HomePage from './pages/HomePage';
import BecomeDonorPage from './pages/BecomeDonorPage';
import HospitalPartnersPage from './pages/HospitalPartnersPage';
import SupportUsPage from './pages/SupportUsPage';
import TrackDonationPage from './pages/TrackDonationPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Dashboard and Portal Layouts/Pages
import DashboardPage from './pages/DashboardPage';
import DonorProfilePage from './pages/DonorProfilePage';
import RedemptionPage from './pages/Dashboard/RedemptionPage'; // New

import HospitalPortalPage from './pages/HospitalPortalPage';
import ManageDonorsPage from './pages/HospitalPortal/ManageDonorsPage'; // New
import RegisterOrganForm from './pages/HospitalPortal/RegisterOrganForm'; // New
import UpdateDonorHealthPage from './pages/HospitalPortal/UpdateDonorHealthPage'; // New

import AdminPortalPage from './pages/AdminPortalPage';

// Dashboard Sub-Pages (used by multiple portals)
import GeospatialHub from './pages/Dashboard/GeospatialHub';
import OrganMatching from './pages/Dashboard/OrganMatching';
import DonationAuditTrail from './pages/Dashboard/DonationAuditTrail';

// Auth and Protection
import ProtectedRoute from './utils/ProtectedRoute';
// import { useAuth } from './hooks/useAuth'; // 'user' from useAuth is not directly used in App.js render

function App() {
  const location = useLocation();
  // const { user } = useAuth(); // Not directly needed here if ProtectedRoute handles user logic

  const showNavAndFooter = ![
    // '/some-fullscreen-page'
  ].includes(location.pathname);

  return (
    <>
      {showNavAndFooter && <Navbar />}
      <main style={{ paddingTop: showNavAndFooter ? '0px' : '0', minHeight: 'calc(100vh - 140px)' }}>
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/become-a-donor" element={<BecomeDonorPage />} />
          <Route path="/hospital-partners" element={<HospitalPartnersPage />} />
          <Route path="/support-us" element={<SupportUsPage />} />
          <Route path="/track-donation" element={<TrackDonationPage />} />
          <Route path="/track-donation/:donorIdFromParams" element={<TrackDonationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* --- Donor Protected Routes (Mainly under /dashboard) --- */}
          <Route element={<ProtectedRoute allowedRoles={['donor', 'hospital_staff', 'admin', 'regulator']} />}>
            {/* DashboardPage acts as a layout or redirector and should contain <Outlet /> */}
            <Route path="/dashboard" element={<DashboardPage />}>
              {/* Default content for /dashboard, or redirect within DashboardPage */}
              {/* <Route index element={<Navigate to="profile" replace />} />  // Option 1: Redirect /dashboard to /dashboard/profile */}
              <Route index element={<div>Welcome to your Dashboard! Select an option.</div>} /> // Option 2: Default content
              <Route path="profile" element={<DonorProfilePage />} />
              <Route path="redeem-tokens" element={<RedemptionPage />} />
            </Route>
          </Route>

          {/* Donor specific routes not under /dashboard layout */}
          <Route element={<ProtectedRoute allowedRoles={['donor']} />}>
            <Route path="/my-donations/:donationId/audit" element={<DonationAuditTrail />} />
            <Route path="/my-donations/track" element={<TrackDonationPage />} />
          </Route>

          {/* --- Hospital Staff (& Admin) Protected Routes --- */}
          <Route element={<ProtectedRoute allowedRoles={['hospital_staff', 'admin']} />}>
            {/* HospitalPortalPage acts as a layout and should contain <Outlet /> */}
            <Route path="/hospital-portal" element={<HospitalPortalPage />}>
              <Route index element={<div className="container card p-3 text-center">Welcome to the Hospital Portal. Please select a module from the navigation.</div>} />
              <Route path="organ-matching" element={<OrganMatching />} />
              {/* Example if OrganMatching needs a param: <Route path="organ-matching/:organForMatchId" element={<OrganMatching />} /> */}
              <Route path="geospatial-hub" element={<GeospatialHub />} /> {/* Note: you had logistics_provider here before, removed for simplicity unless it's a defined role */}
              <Route path="audit-trail/:donationId" element={<DonationAuditTrail />} /> {/* Also accessible by regulator */}
              <Route path="manage-donors" element={<ManageDonorsPage />} />
              <Route path="register-organ" element={<RegisterOrganForm />} />
              <Route path="register-organ/:donorDidParam" element={<RegisterOrganForm />} />
              <Route path="update-donor-health/:donorDbId" element={<UpdateDonorHealthPage />} />
              {/* Placeholder for a route mentioned in HospitalPortalPage.js if needed */}
              <Route path="patient-registry" element={<div className="container card p-3">Patient Registry Page (Work in Progress)</div>} />
            </Route>
          </Route>

          {/* --- Admin & Regulator Protected Routes --- */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'regulator']} />}>
            {/* AdminPortalPage acts as a layout and should contain <Outlet /> */}
            <Route path="/admin-portal" element={<AdminPortalPage />}>
              <Route index element={<div className="container card p-3 text-center">Welcome to the Admin/Regulator Portal. Please select a module.</div>} />
              {/* Admin/Regulator can also see generic audit trails, or specific system-wide ones */}
              <Route path="audit-trail/:donationId" element={<DonationAuditTrail />} />
              {/* Placeholder routes from AdminPortalPage.js */}
              <Route path="user-management" element={<div className="container card p-3">User Management (Work in Progress)</div>} />
              <Route path="hospital-management" element={<div className="container card p-3">Hospital Management (Work in Progress)</div>} />
              <Route path="system-audit/all" element={<div className="container card p-3">System-Wide Audit (Work in Progress)</div>} />
              <Route path="analytics-reporting" element={<div className="container card p-3">Analytics & Reporting (Work in Progress)</div>} />
              <Route path="platform-settings" element={<div className="container card p-3">Platform Settings (Work in Progress)</div>} />
              <Route path="content-management" element={<div className="container card p-3">Content Management (Work in Progress)</div>} />
            </Route>
          </Route>

          {/* Catch-all for 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showNavAndFooter && <Footer />}
    </>
  );
}

export default App;