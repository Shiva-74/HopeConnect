// Create/open hopeconnect-frontend/src/pages/TrackDonationPage.js
import React, { useState, useEffect, useCallback } from 'react';
import PageTitle from '../components/Common/PageTitle';
import InputField from '../components/Form/InputField';
import Button from '../components/Common/Button';
import LoadingSpinner from '../components/Common/LoadingSpinner';
// import { trackDonationById } from '../services/trackingService';
import './TrackDonationPage.css'; // Make sure this CSS file exists
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // To potentially prefill donor ID if logged in

// Mock data for demonstration
const mockDonationData = {
  'DONOR123': {
    donorId: 'DONOR123',
    donorName: "Aanya Sharma (Deceased Donor)",
    dateOfDonation: '2025-05-14',
    summaryMessage: "Thank you for your noble contribution. The gift of life from Aanya Sharma has touched multiple lives.",
    donations: [
      { organ: 'Heart', icon: '❤️', status: 'Transplanted Successfully', recipientInfo: 'Male, 45 years, AIIMS Delhi', id: 'HT-2025-0547', transplantDate: '2025-05-15' },
      { organ: 'Lungs (Pair)', icon: '🫁', status: 'Transplanted Successfully', recipientInfo: 'Female, 32 years, Fortis Hospital', id: 'LU-2025-0012', transplantDate: '2025-05-16' },
      { organ: 'Liver', icon: '🧡', status: 'Awaiting Transplant', recipientInfo: 'Matched to Patient J.K., Apollo Hospital', id: 'LV-2025-0088', transplantDate: null },
      { organ: 'Kidneys (Pair)', icon: ' किडनी', status: 'One Transplanted, One Matched', recipientInfo: 'Kidney 1: Male, 58, Max Healthcare; Kidney 2: Female, 29, PGIMER', id: 'KD-2025-1122', transplantDate: '2025-05-17 (Kidney 1)' },
      { organ: 'Corneas', icon: '👁️', status: 'Stored for Future Use', recipientInfo: 'Regional Eye Bank', id: 'CR-2025-0788', transplantDate: null },
    ],
    retrievalMessage: "Donor information retrieved successfully. This is a simplified view for demonstration."
  },
  'XYZ789': {
    donorId: 'XYZ789',
    donorName: "Rohan Verma (Living Donor - Kidney)",
    dateOfDonation: '2025-06-01',
    summaryMessage: "Rohan Verma's selfless act of living kidney donation is deeply appreciated.",
    donations: [
      { organ: 'Kidney (Left)', icon: ' किडनी', status: 'Transplanted Successfully', recipientInfo: 'Female, 40 years, Medanta Hospital', id: 'LKID-2025-0033', transplantDate: '2025-06-02'},
    ],
    retrievalMessage: "Donor information retrieved successfully."
  }
};


const TrackDonationPage = () => {
  const { user } = useAuth();
  const { donorIdFromParams } = useParams();
  const [donorId, setDonorId] = useState(donorIdFromParams || user?.donorId || ''); // Prefill if available
  const [donationInfo, setDonationInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback(async (searchIdParam) => {
    const idToSearch = (searchIdParam || donorId || '').trim().toUpperCase(); // Ensure donorId state is used if no param
    if (!idToSearch) {
      setError('Please enter a Donor ID or Organ/Donation ID.');
      setDonationInfo(null);
      return;
    }
    setIsLoading(true);
    setError('');
    setDonationInfo(null);
    try {
      // const data = await trackDonationById(idToSearch); // Real API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      let data = mockDonationData[idToSearch];
      if (!data) {
        for (const mainId in mockDonationData) {
            const foundOrgan = mockDonationData[mainId].donations.find(d => d.id === idToSearch);
            if (foundOrgan) {
                data = { ...mockDonationData[mainId], highlightOrganId: idToSearch };
                break;
            }
        }
      }

      if (data) {
        setDonationInfo(data);
      } else {
        setError('No donation found for this ID. Please check the ID and try again.');
      }
    } catch (err) {
      setError('Failed to retrieve donation information. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [donorId]); // Dependency on donorId state for manual search

  useEffect(() => {
    if (donorIdFromParams) {
      const upperParamsId = donorIdFromParams.toUpperCase();
      setDonorId(upperParamsId); // Update state if params change
      handleSearch(upperParamsId); // Trigger search with param
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donorIdFromParams]); // Only re-run if URL param changes

  const handleViewDetails = (donationItem) => {
    if (user?.role === 'donor' && donationInfo?.donorId === user?.donorId) {
        navigate(`/my-donations/${donationItem.id}/audit`);
    } else {
        navigate(`/hospital-portal/audit-trail/${donationItem.id}`);
    }
  };

  const getStatusClass = (status) => {
    status = status.toLowerCase();
    if (status.includes('transit')) return 'status-in-transit';
    if (status.includes('transplanted successfully')) return 'status-successful';
    if (status.includes('awaiting transplant') || status.includes('matched')) return 'status-matched';
    if (status.includes('storage') || status.includes('pending')) return 'status-pending';
    return 'status-default';
  };

  return (
    <div className="track-donation-page">
      <PageTitle
        title="Track Donation Status"
        subtitle="Enter Donor ID or specific Organ/Donation ID for real-time updates."
      />
      <div className="container">
        <form onSubmit={(e) => {e.preventDefault(); handleSearch();}} className="track-donation-form card">
          <InputField
            type="text"
            id="donorIdInput"
            value={donorId}
            onChange={(e) => setDonorId(e.target.value.toUpperCase())}
            placeholder="Enter ID (e.g., DONOR123 or LV-2025-0088)"
            className="flex-grow-1"
          />
          <Button type="submit" className="btn-primary" disabled={isLoading} style={{ minWidth: '120px' }}>
            {isLoading ? <LoadingSpinner size="20px" color="#fff"/> : 'Track'}
          </Button>
        </form>

        {isLoading && <div className="text-center mt-3"><LoadingSpinner size="60px"/></div>}
        {error && <p className="error-message card">{error}</p>}

        {donationInfo && !error && (
          <div className="donation-summary-card card">
            <h3>Donation Overview for {donationInfo.donorName || donationInfo.donorId}</h3>
            <p className="summary-meta">Date of Donation: {new Date(donationInfo.dateOfDonation).toLocaleDateString()}</p>
            <p className="summary-thank-you">{donationInfo.summaryMessage}</p>

            <div className="donations-list-container">
              <h4>Organ/Tissue Details:</h4>
              <div className="donations-list-grid">
                {donationInfo.donations.map((item, index) => (
                  <div key={index} className={`donation-item-card ${item.id === donationInfo.highlightOrganId ? 'highlighted' : ''}`}>
                    <div className="item-organ-header">
                      <span className="organ-icon">{item.icon}</span>
                      <span className="organ-name">{item.organ}</span>
                      <span className={`item-status-badge ${getStatusClass(item.status)}`}>{item.status}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>ID:</strong> {item.id}</p>
                      <p><strong>Recipient/Location:</strong> {item.recipientInfo}</p>
                      {item.transplantDate && <p><strong>Transplant Date:</strong> {new Date(item.transplantDate).toLocaleDateString()}</p>}
                    </div>
                    <Button className="btn-secondary btn-sm item-action-button" onClick={() => handleViewDetails(item)}>
                      View Full Audit Trail
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {donationInfo.retrievalMessage && <div className="retrieval-toast">{donationInfo.retrievalMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackDonationPage;