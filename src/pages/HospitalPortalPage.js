import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import PageTitle from '../components/Common/PageTitle';
import StatCard from '../components/Dashboard/StatCard';
import { useAuth } from '../hooks/useAuth'; // For user role
import './HospitalPortalPage.css'; // Make sure this CSS file exists

// Mock data for hospital dashboard
const hospitalStats = {
    pendingOffers: 5,
    activeTransports: 2,
    successfulTransplantsMonth: 12,
    averageWaitTimeReduction: '15%',
    criticalAlerts: 1, // New stat
};

const HospitalPortalPage = () => {
    const { user } = useAuth(); // Get user to check role
    const location = useLocation();
    const isPortalHome = location.pathname === '/hospital-portal' || location.pathname === '/hospital-portal/'; // Handles trailing slash

    // Redirect if not hospital staff or admin (who might also access)
    if (user && user.role !== 'hospital_staff' && user.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

  return (
    <div className="hospital-portal-page">
      <PageTitle 
        title={user?.hospitalName || "Hospital Portal"} // Use actual hospital name if available in user object
        subtitle="Manage organ donations, recipient matching, and logistics efficiently." 
      />
      
      <div className="container portal-content">
        {isPortalHome && (
            <>
            <section className="overview-stats-hospital">
                <StatCard title="Pending Donor Offers" value={hospitalStats.pendingOffers} icon="📥" color="#007bff" link="/hospital-portal/organ-matching" />
                <StatCard title="Active Organ Transports" value={hospitalStats.activeTransports} icon="🚚" color="#17a2b8" link="/hospital-portal/geospatial-hub"/>
                <StatCard title="Transplants This Month" value={hospitalStats.successfulTransplantsMonth} icon="🏆" color="#28a745" />
                <StatCard title="Critical Alerts" value={hospitalStats.criticalAlerts} icon="⚠️" color="#dc3545" />
            </section>

            <section className="quick-actions-section card">
                <h3>Key Actions & Modules</h3>
                <div className="actions-grid">
                    <Link to="/hospital-portal/organ-matching" className="action-item-card">
                        <span className="action-icon">🔄</span>
                        <h4>AI Organ Matching</h4>
                        <p>View AI-ranked recipients, manage potential matches, and initiate allocation.</p>
                    </Link>
                    <Link to="/hospital-portal/geospatial-hub" className="action-item-card">
                        <span className="action-icon">🗺️</span>
                        <h4>Geospatial Hub</h4>
                        <p>Track organ transport, view ETAs, and manage logistics in real-time.</p>
                    </Link>
                    <Link to="/hospital-portal/audit-trail/LV-2025-0547" className="action-item-card"> {/* Example ID */}
                        <span className="action-icon">📜</span>
                        <h4>View Audit Trails</h4>
                         <p>Access immutable chain-of-custody records for donations and transplants.</p>
                    </Link>
                     {/* Add more relevant actions for hospital staff */}
                    <Link to="/hospital-portal/patient-registry" className="action-item-card"> {/* Placeholder */}
                        <span className="action-icon">📋</span>
                        <h4>Patient Registry</h4>
                         <p>Manage patient waiting lists and update recipient information.</p>
                    </Link>
                </div>
            </section>
            </>
        )}
        
        {/* This will render child routes like OrganMatching, GeospatialHub */}
        {!isPortalHome && <div className="portal-view-content-area"><Outlet /></div>}
      </div>
    </div>
  );
};

export default HospitalPortalPage;