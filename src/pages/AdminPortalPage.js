import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import PageTitle from '../components/Common/PageTitle';
import StatCard from '../components/Dashboard/StatCard';
import { useAuth } from '../hooks/useAuth'; // For user role
import './AdminPortalPage.css'; // Create this CSS file

// Mock data for admin/regulator dashboard
const adminStats = {
    totalDonors: 5230,
    totalTransplants: 512,
    complianceRate: '99.8%',
    hospitalsNetworked: 55,
    pendingVerifications: 12, // e.g., hospitals, users
    activeSystemAlerts: 3,
};

const AdminPortalPage = () => {
    const { user } = useAuth(); // Get user to check role
    const location = useLocation();
    const isAdminHome = location.pathname === '/admin-portal' || location.pathname === '/admin-portal/';

    // Redirect if not admin or regulator
    if (user && user.role !== 'admin' && user.role !== 'regulator') {
        return <Navigate to="/unauthorized" replace />;
    }
    const portalTitle = user?.role === 'admin' ? "Administrator Portal" : "Regulator Portal";

  return (
    <div className="admin-portal-page">
      <PageTitle 
        title={portalTitle} 
        subtitle="Oversee system operations, compliance, analytics, and user management." 
      />
      
      <div className="container portal-content">
        {isAdminHome && (
            <>
            <section className="overview-stats-admin">
                <StatCard title="Total Registered Donors" value={adminStats.totalDonors.toLocaleString()} icon="👥" color="#007bff" />
                <StatCard title="Transplants Facilitated" value={adminStats.totalTransplants.toLocaleString()} icon="⚕️" color="#28a745" />
                <StatCard title="System Compliance Rate" value={adminStats.complianceRate} icon="✔️" color="#17a2b8" />
                <StatCard title="Hospitals in Network" value={adminStats.hospitalsNetworked} icon="🏥" color="#ffc107" />
                <StatCard title="Pending Verifications" value={adminStats.pendingVerifications} icon="⏳" color="#fd7e14" />
                <StatCard title="Active System Alerts" value={adminStats.activeSystemAlerts} icon="🚨" color="#dc3545" />
            </section>

            <section className="quick-actions-section card">
                <h3>Key Management Areas</h3>
                <div className="actions-grid">
                    <Link to="/admin-portal/user-management" className="action-item-card"> {/* Placeholder */}
                        <span className="action-icon">👤</span>
                        <h4>User Management</h4>
                        <p>Manage users, roles, and permissions across the platform.</p>
                    </Link>
                    <Link to="/admin-portal/hospital-management" className="action-item-card"> {/* Placeholder */}
                        <span className="action-icon">🏥</span>
                        <h4>Hospital Network</h4>
                        <p>Oversee partner hospitals, onboarding, and performance.</p>
                    </Link>
                    <Link to="/admin-portal/system-audit/all" className="action-item-card">  {/* Example Link */}
                        <span className="action-icon">🔍</span>
                        <h4>System-Wide Audit</h4>
                        <p>Review comprehensive audit logs and chain-of-custody data.</p>
                    </Link>
                    <Link to="/admin-portal/analytics-reporting" className="action-item-card"> {/* Placeholder */}
                        <span className="action-icon">📊</span>
                        <h4>Analytics & Reporting</h4>
                        <p>Monitor compliance, fairness, and operational metrics.</p>
                    </Link>
                    <Link to="/admin-portal/platform-settings" className="action-item-card"> {/* Placeholder */}
                        <span className="action-icon">⚙️</span>
                        <h4>Platform Settings</h4>
                        <p>Configure system parameters, notifications, and integrations.</p>
                    </Link>
                    <Link to="/admin-portal/content-management" className="action-item-card"> {/* Placeholder */}
                        <span className="action-icon">✍️</span>
                        <h4>Content Management</h4>
                        <p>Update public-facing information, FAQs, and resources.</p>
                    </Link>
                </div>
            </section>
            </>
        )}
        
        {/* This will render child routes for specific admin/regulator views */}
        {!isAdminHome && <div className="portal-view-content-area"><Outlet /></div>}
      </div>
    </div>
  );
};

export default AdminPortalPage;