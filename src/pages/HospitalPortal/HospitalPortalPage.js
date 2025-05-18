import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import PageTitle from '../../components/Common/PageTitle';
import StatCard from '../../components/Dashboard/StatCard';
import { useAuth } from '../../hooks/useAuth';
import './HospitalPortalPage.css'; // Ensure this CSS file exists

// Mock data for hospital dashboard - replace with API calls later
const mockHospitalStats = {
    pendingOrganRequests: 8,    // Requests made by this hospital
    availableOrgansInNetwork: 15, // Organs potentially matchable for this hospital's patients
    activeTransportsToHospital: 3, // Organs en route TO this hospital
    successfulTransplantsMonth: 7,  // Transplants performed by this hospital
    averageOrganWaitTime: '120 days', // For patients at this hospital
    complianceScore: '98%',         // Hospital's compliance with protocols
};

const HospitalPortalPage = () => {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    
    // Check if the current path is exactly "/hospital-portal" or "/hospital-portal/"
    const isPortalHome = location.pathname === '/hospital-portal' || location.pathname === '/hospital-portal/';

    if (authLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 140px)' }}>
                <LoadingSpinner size="60px" />
            </div>
        );
    }

    // Redirect if not hospital staff or admin
    if (!user || (user.role !== 'hospital_staff' && user.role !== 'admin')) {
        console.warn("HospitalPortalPage: User not authorized or not logged in. Role:", user?.role);
        return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }

    // Attempt to get hospital name, default if not available
    // In a real app, user.hospitalName or user.hospital.name would come from the backend login/profile response
    const hospitalName = user.hospitalName || user.name || "Your Hospital"; 

    return (
        <div className="hospital-portal-page">
            <PageTitle 
                title={`${hospitalName} Portal`}
                subtitle="Manage organ requests, matching, logistics, and donor interactions." 
            />
            
            <div className="container portal-content">
                {isPortalHome && (
                    <>
                        <section className="overview-stats-hospital">
                            <StatCard 
                                title="My Pending Organ Requests" 
                                value={mockHospitalStats.pendingOrganRequests} 
                                icon="📝" 
                                color="#007bff" 
                                link="/hospital-portal/my-requests" // Example link
                            />
                            <StatCard 
                                title="Organs Available (Network)" 
                                value={mockHospitalStats.availableOrgansInNetwork} 
                                icon="🌐" 
                                color="#17a2b8"
                                link="/hospital-portal/organ-matching"
                            />
                            <StatCard 
                                title="Active Transports to Us" 
                                value={mockHospitalStats.activeTransportsToHospital} 
                                icon="🚚" 
                                color="#28a745"
                                link="/hospital-portal/geospatial-hub"
                            />
                            <StatCard 
                                title="Transplants This Month" 
                                value={mockHospitalStats.successfulTransplantsMonth} 
                                icon="🏆" 
                                color="#ffc107" 
                            />
                             <StatCard 
                                title="Avg. Patient Wait Time" 
                                value={mockHospitalStats.averageOrganWaitTime} 
                                icon="⏳" 
                                color="#6f42c1"
                            />
                             <StatCard 
                                title="Compliance Score" 
                                value={mockHospitalStats.complianceScore} 
                                icon="🛡️" 
                                color="#fd7e14"
                            />
                        </section>

                        <section className="quick-actions-section card">
                            <h3>Key Hospital Modules</h3>
                            <div className="actions-grid">
                                <Link to="/hospital-portal/request-organ" className="action-item-card">
                                    <span className="action-icon">➕</span>
                                    <h4>New Organ Request</h4>
                                    <p>Submit a new request for a patient needing a transplant.</p>
                                </Link>
                                <Link to="/hospital-portal/manage-donors" className="action-item-card">
                                    <span className="action-icon">👥</span>
                                    <h4>Manage Donors</h4>
                                    <p>Search donor registry, view profiles, and register recovered organs.</p>
                                </Link>
                                <Link to="/hospital-portal/organ-matching" className="action-item-card">
                                    <span className="action-icon">🔄</span>
                                    <h4>AI Organ Matching</h4>
                                    <p>View AI-ranked recipients for available organs and initiate allocation.</p>
                                </Link>
                                <Link to="/hospital-portal/geospatial-hub" className="action-item-card">
                                    <span className="action-icon">🗺️</span>
                                    <h4>Geospatial Hub</h4>
                                    <p>Track organ transport, view ETAs, and manage logistics in real-time.</p>
                                </Link>
                                <Link to="/hospital-portal/transplant-logs" className="action-item-card"> {/* Placeholder link */}
                                    <span className="action-icon">📈</span>
                                    <h4>Transplant Analytics</h4>
                                    <p>Review transplant outcomes, waitlist statistics, and performance metrics.</p>
                                </Link>
                                <Link to="/hospital-portal/notifications" className="action-item-card"> {/* Placeholder link */}
                                    <span className="action-icon">🔔</span>
                                    <h4>Notifications & Alerts</h4>
                                    <p>View important system alerts and notifications relevant to your hospital.</p>
                                </Link>
                            </div>
                        </section>
                    </>
                )}
                
                {/* This Outlet will render child routes when not on the portal's home page */}
                {!isPortalHome && (
                    <div className="portal-view-content-area">
                        <Outlet />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalPortalPage;