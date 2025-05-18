import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageTitle from '../components/Common/PageTitle';
import './DashboardPage.css'; // Make sure this CSS file exists

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  // If user is directly on /dashboard, redirect based on role to their specific portal/profile
  if (location.pathname === '/dashboard' && user) {
    if (user.role === 'donor') return <Navigate to="/dashboard/profile" replace />;
    if (user.role === 'hospital_staff') return <Navigate to="/hospital-portal" replace />;
    if (user.role === 'admin' || user.role === 'regulator') return <Navigate to="/admin-portal" replace />;
    // Fallback for any other role or if no specific redirect is set
  }


  const getWelcomeMessage = () => {
    if (!user) return "Welcome to your Dashboard!"; // Should not happen if protected
    // This message might not be shown if redirecting, but good as a fallback
    switch (user.role) {
      case 'donor':
        return `Welcome, ${user.name || 'Donor'}! View your profile and donation impact.`;
      case 'hospital_staff':
        return `Welcome, ${user.name || 'Staff'}! Access organ matching, logistics, and patient data.`;
      case 'admin':
        return `Welcome, ${user.name || 'Admin'}! Manage the platform and oversee operations.`;
      case 'regulator':
        return `Welcome, ${user.name || 'Regulator'}! Monitor compliance and system analytics.`;
      default:
        return `Welcome, ${user.name}! Access your dashboard features.`;
    }
  };

  return (
    <div className="dashboard-page">
      {/* The PageTitle might be redundant if we always redirect from /dashboard */}
      {location.pathname === '/dashboard' && <PageTitle title="Dashboard" subtitle={getWelcomeMessage()} />}
      
      <div className="container dashboard-content">
        {/* Outlet will render child routes like /dashboard/profile */}
        {/* If /dashboard itself has content before redirect, it would go here. */}
        {/* For now, content is primarily in the role-specific pages or /dashboard/profile */}
        <Outlet /> 
      </div>
    </div>
  );
};

export default DashboardPage;