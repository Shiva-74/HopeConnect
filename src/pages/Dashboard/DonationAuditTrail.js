import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// import PageTitle from '../../components/Common/PageTitle'; // Usually from parent layout
import AuditTrailItem from '../../components/Dashboard/AuditTrailItem';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
// import { getDonationAuditTrail } from '../../services/trackingService';
import './DonationAuditTrail.css'; // Make sure this CSS file exists
import Button from '../../components/Common/Button'; // For back button

// Mock data for a specific donation audit trail
const mockAuditData = {
  'LV-2025-0547': { // Liver Donation ID
    donationId: 'LV-2025-0547',
    organType: 'Liver',
    donorId: 'DONOR123', // Link back to donor
    donorName: 'Aanya Sharma (Deceased)',
    recipientId: 'RECIP-088', // Link to recipient
    recipientName: 'Patient J.K.',
    currentStatus: 'Transplant Successful',
    transplantDate: '2025-05-16T08:00:00Z',
    hospitalName: 'AIIMS Delhi',
    trail: [
      { stepNumber: 1, title: 'Donor Consent Recorded on OrganChain', timestamp: '2025-05-14 09:15:23 UTC', actor: 'HopeConnect System (via Hospital A)', details: 'Digital consent form (Ref: CONSENT-XYZ) securely stored. Hash: 0xabc...def', status: 'completed' },
      { 
        stepNumber: 2, 
        title: 'Organ Recovery & Preparation', 
        timestamp: '2025-05-15 10:32:05 UTC', 
        actor: 'Surgical Team, Hospital A', 
        details: (
            <>
                <p>Liver successfully recovered. Quality assessment: Excellent.</p>
                <p>Perfusion Started: 2025-05-15 10:35:00 UTC.</p>
                <p><strong>Blockchain TxID:</strong> 0x3bc6fb96...d1ba3197</p>
                <p><strong>Chain Details:</strong> OrganChain (HopeConnect Network)</p>
            </>
        ),
        isExpandedDefault: false, status: 'completed'
      },
      { stepNumber: 3, title: 'Logistics: Transport Initiated', timestamp: '2025-05-15 10:45:12 UTC', actor: 'HopeConnect Logistics (Partner: QuickTrans)', details: 'Organ en route to AIIMS Delhi via Green Corridor. Vehicle: DL1CA1234. ETA: 2025-05-15 12:00:00 UTC. Cold chain active.', status: 'completed' },
      { stepNumber: 4, title: 'Logistics: Organ Arrived at Recipient Hospital', timestamp: '2025-05-15 11:55:03 UTC', actor: 'Receiving Team, AIIMS Delhi', details: 'Organ received. Cold chain integrity confirmed (Temp: 4.2°C). Cross-match final check: OK.', status: 'completed' },
      { stepNumber: 5, title: 'Transplant Surgery Commenced', timestamp: '2025-05-15 13:00:00 UTC', actor: 'Surgical Team, AIIMS Delhi', details: 'Recipient (RECIP-088) prepped. Surgery underway with Dr. Mehta leading.', status: 'completed' },
      { stepNumber: 6, title: 'Transplant Surgery Successful', timestamp: '2025-05-15 17:30:45 UTC', actor: 'Surgical Team, AIIMS Delhi', details: 'Surgery completed. Patient stable and moved to ICU. Initial graft function: Good.', status: 'completed', isExpandedDefault: true },
      { stepNumber: 7, title: 'Post-Transplant Monitoring (Day 1)', timestamp: '2025-05-16 09:00:00 UTC', actor: 'Medical Team, AIIMS Delhi', details: 'Patient vital signs stable. Immunosuppression therapy initiated. Graft function parameters within expected range.', status: 'completed' },
    ]
  },
  // Add more mock data for other IDs if needed
};


const DonationAuditTrail = () => {
  const { donationId } = useParams();
  const [auditTrail, setAuditTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAuditTrail = useCallback(async () => {
    if (!donationId) {
      setError('No donation ID provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // const data = await getDonationAuditTrail(donationId);
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API call
      const data = mockAuditData[donationId.toUpperCase()]; // Ensure case-insensitivity for mock
      if (data) {
        setAuditTrail(data);
      } else {
        setError(`Audit trail not found for Donation ID: ${donationId}`);
        setAuditTrail(null);
      }
    } catch (err) {
      setError('Failed to retrieve audit trail information. Please try again later.');
      console.error(err);
      setAuditTrail(null);
    } finally {
      setLoading(false);
    }
  }, [donationId]);

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  if (loading) {
    return <div className="container text-center mt-5 pt-5"><LoadingSpinner size="60px"/></div>;
  }
  
  const getStatusClass = (status) => {
    status = status?.toLowerCase().replace(/\s+/g, '-');
    if (status?.includes('successful')) return 'status-successful';
    if (status?.includes('progress') || status?.includes('transit')) return 'status-in-progress';
    if (status?.includes('pending') || status?.includes('awaiting')) return 'status-pending';
    return 'status-default';
  };


  return (
    <div className="donation-audit-trail-page">
       <div className="page-header-controls">
            <div>
                <h3>Donation Audit Trail</h3>
                <p className='mb-0 page-subtitle-text'>
                    Immutable record for Organ ID: <strong style={{color: '#007bff'}}>{donationId}</strong>
                </p>
            </div>
            <Button className="btn-outline btn-sm" onClick={() => navigate(-1)} style={{alignSelf: 'center'}}>
                ← Go Back
            </Button>
        </div>

      {error && <p className="error-message card">{error}</p>}

      {!auditTrail && !loading && !error && (
        <div className="card text-center p-4">
          <p>No audit trail information available for this ID, or the ID is invalid.</p>
          <Link to="/track-donation" className="btn btn-secondary mt-2">Track Another Donation</Link>
        </div>
      )}

      {auditTrail && (
        <div className="audit-trail-container card">
            <div className="audit-summary-panel">
                <div className="summary-item"><strong>Organ Type:</strong> {auditTrail.organType}</div>
                <div className="summary-item"><strong>Current Status:</strong> <span className={`status-tag ${getStatusClass(auditTrail.currentStatus)}`}>{auditTrail.currentStatus}</span></div>
                <div className="summary-item"><strong>Donor:</strong> <Link to={`/track-donation/${auditTrail.donorId}`}>{auditTrail.donorName} (ID: {auditTrail.donorId})</Link></div>
                <div className="summary-item"><strong>Recipient:</strong> {auditTrail.recipientName} (ID: {auditTrail.recipientId})</div>
                {auditTrail.transplantDate && <div className="summary-item"><strong>Transplant Date:</strong> {new Date(auditTrail.transplantDate).toLocaleString()}</div>}
                <div className="summary-item"><strong>Transplant Hospital:</strong> {auditTrail.hospitalName}</div>
            </div>
          <div className="audit-steps-list">
            {auditTrail.trail.map((item, index) => (
              <AuditTrailItem
                key={item.stepNumber}
                stepNumber={item.stepNumber}
                title={item.title}
                timestamp={item.timestamp}
                actor={item.actor}
                details={item.details}
                isLast={index === auditTrail.trail.length - 1}
                isExpandedDefault={item.isExpandedDefault || false}
                status={item.status || 'completed'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationAuditTrail;