import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuditTrailItem from '../../components/Dashboard/AuditTrailItem';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import { getDonationAuditTrail } from '../../services/trackingService'; // Ensure this service exists and is correct
import './DonationAuditTrail.css'; 

// Mock data (keep for dev)
const mockAuditData = {
  'LV-2025-0547': { // Example: Liver Donation ID
    donationId: 'LV-2025-0547', organType: 'Liver', donorId: 'DONOR123', donorName: 'Aanya Sharma (Deceased)',
    recipientId: 'RECIP-088', recipientName: 'Patient J.K.', currentStatus: 'Transplant Successful',
    transplantDate: '2025-05-16T08:00:00Z', hospitalName: 'AIIMS Delhi',
    trail: [
      { stepNumber: 1, title: 'Donor Consent Recorded on OrganChain', timestamp: '2025-05-14 09:15:23 UTC', actor: 'System (Hospital A)', details: 'Digital consent form (Ref: CONSENT-XYZ) securely stored. Hash: 0xabc...def', status: 'completed' },
      { stepNumber: 2, title: 'Organ Recovery & Preparation', timestamp: '2025-05-15 10:32:05 UTC', actor: 'Surgical Team, Hospital A', details: (<><p>Liver successfully recovered. Quality assessment: Excellent.</p><p>Perfusion Started: 2025-05-15 10:35:00 UTC.</p><p><strong>Blockchain TxID:</strong> 0x3bc6fb96...d1ba3197</p></>), isExpandedDefault: true, status: 'completed'},
      { stepNumber: 3, title: 'Logistics: Transport Initiated', timestamp: '2025-05-15 10:45:12 UTC', actor: 'HopeConnect Logistics', details: 'Organ en route to AIIMS Delhi via Green Corridor. ETA: 12:00 UTC.', status: 'completed' },
      { stepNumber: 4, title: 'Logistics: Organ Arrived at AIIMS Delhi', timestamp: '2025-05-15 11:55:03 UTC', actor: 'Receiving Team, AIIMS Delhi', details: 'Organ received. Cold chain integrity confirmed.', status: 'completed' },
      { stepNumber: 5, title: 'Transplant Surgery Commenced', timestamp: '2025-05-15 13:00:00 UTC', actor: 'Surgical Team, AIIMS Delhi', details: 'Surgery for RECIP-088 underway.', status: 'completed' },
      { stepNumber: 6, title: 'Transplant Surgery Successful', timestamp: '2025-05-15 17:30:45 UTC', actor: 'Surgical Team, AIIMS Delhi', details: 'Patient stable and moved to ICU.', status: 'completed', isExpandedDefault: true },
    ]
  },
  'HT-2025-0547': {
    donationId: 'HT-2025-0547', organType: 'Heart', donorId: 'DONOR123', donorName: 'Aanya Sharma (Deceased)',
    recipientId: 'RECIP-XYZ', recipientName: 'Patient A.B.', currentStatus: 'Post-Transplant Monitoring',
    transplantDate: '2025-05-15T11:00:00Z', hospitalName: 'Fortis Hospital',
    trail: [
      { stepNumber: 1, title: 'Donor Consent', timestamp: '2025-05-14 09:15:23 UTC', actor: 'System', details: 'Consent recorded.', status: 'completed' },
      { stepNumber: 2, title: 'Organ Recovery', timestamp: '2025-05-15 07:00:00 UTC', actor: 'Hospital A Surgical Team', details: 'Heart recovered in good condition.', status: 'completed' },
      { stepNumber: 3, title: 'Transport to Fortis', timestamp: '2025-05-15 07:30:00 UTC', actor: 'Logistics Team', details: 'Transport initiated via ambulance.', status: 'completed' },
      { stepNumber: 4, title: 'Transplant Successful', timestamp: '2025-05-15 11:00:00 UTC', actor: 'Fortis Surgical Team', details: 'Heart transplant surgery successful.', status: 'completed', isExpandedDefault: true },
    ]
  }
};

const DonationAuditTrail = () => {
  const { donationId } = useParams(); // This should be the organChainId or a unique log ID
  const [auditTrail, setAuditTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAuditTrail = useCallback(async () => {
    if (!donationId) {
      setError('No Donation ID provided in the URL.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // const data = await getDonationAuditTrail(donationId);
      // Mock:
      await new Promise(resolve => setTimeout(resolve, 600));
      const data = mockAuditData[donationId.toUpperCase()]; 
      
      if (data) {
        setAuditTrail(data);
      } else {
        setError(`Audit trail not found for Donation ID: ${donationId}. Please check the ID or try tracking via Donor ID.`);
        setAuditTrail(null);
      }
    } catch (err) {
      setError('Failed to retrieve audit trail. ' + (err.response?.data?.message || err.message));
      console.error(err);
      setAuditTrail(null);
    } finally {
      setLoading(false);
    }
  }, [donationId]);

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  const getStatusClass = (status) => {
    const s = status?.toLowerCase().replace(/\s+/g, '-') || 'default';
    if (s.includes('successful') || s.includes('completed')) return 'status-successful';
    if (s.includes('progress') || s.includes('transit')) return 'status-in-progress';
    if (s.includes('pending') || s.includes('awaiting')) return 'status-pending';
    if (s.includes('failed') || s.includes('error')) return 'status-error';
    return 'status-default';
  };

  if (loading) {
    return <div className="container text-center mt-5 pt-5"><LoadingSpinner size="60px"/></div>;
  }

  return (
    <div className="donation-audit-trail-page container">
       <div className="page-header-controls">
            <div>
                <h3>Donation Journey Audit Trail</h3>
                <p className='mb-0 page-subtitle-text'>
                    Tracking Organ/Donation ID: <strong style={{color: '#007bff'}}>{donationId}</strong>
                </p>
            </div>
            <Button className="btn-outline btn-sm" onClick={() => navigate(-1)} style={{alignSelf: 'center'}}>
                ← Go Back
            </Button>
        </div>

      {error && <p className="error-message card">{error}</p>}

      {!auditTrail && !loading && !error && (
        <div className="card text-center p-4">
          <p>No audit trail information available for this ID.</p>
          <Link to="/track-donation" className="btn btn-secondary mt-2">Track Another ID</Link>
        </div>
      )}

      {auditTrail && (
        <div className="audit-trail-container card">
            <div className="audit-summary-panel">
                <div className="summary-item"><strong>Organ Type:</strong> {auditTrail.organType}</div>
                <div className="summary-item"><strong>Current Status:</strong> <span className={`status-tag ${getStatusClass(auditTrail.currentStatus)}`}>{auditTrail.currentStatus}</span></div>
                <div className="summary-item"><strong>Donor:</strong> <Link to={`/track-donation?id=${auditTrail.donorId}`}>{auditTrail.donorName} ({auditTrail.donorId})</Link></div>
                <div className="summary-item"><strong>Recipient:</strong> {auditTrail.recipientName || 'N/A'} ({auditTrail.recipientId || 'N/A'})</div>
                {auditTrail.transplantDate && <div className="summary-item"><strong>Transplant Date:</strong> {new Date(auditTrail.transplantDate).toLocaleString()}</div>}
                <div className="summary-item"><strong>Primary Hospital:</strong> {auditTrail.hospitalName || 'N/A'}</div>
            </div>
          <div className="audit-steps-list">
            {auditTrail.trail.map((item, index) => (
              <AuditTrailItem
                key={item.stepNumber || index} // Use index as fallback if stepNumber isn't unique/present
                stepNumber={item.stepNumber}
                title={item.title}
                timestamp={item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
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