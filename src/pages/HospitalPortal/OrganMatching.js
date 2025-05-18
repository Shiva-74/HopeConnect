import React, { useState, useEffect, useCallback } from 'react';
import PageTitle from '../../components/Common/PageTitle'; // Assuming this component exists
import Button from '../../components/Common/Button';
import RecipientTableRow from '../../components/Dashboard/RecipientTableRow'; // You'll use this to display matches
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Modal from '../../components/Common/Modal';
import { 
    getAvailableOrgansForMatching, 
    getPotentialRecipientsForOrgan, // This service now takes organBlockchainId
    getMatchingFactors, // To fetch AI factors
    confirmMatchAndInitiateTransfer // Service to confirm a match
} from '../../services/hospitalService'; // Ensure this path is correct
import './OrganMatching.css'; // Ensure this CSS file exists

// Mock Data (can be removed once backend services are fully functional)
const mockAvailableFactors = [
  { id: 'age', name: 'Age Compatibility (±10 yrs)', weight: 0.8, default: true },
  { id: 'distance', name: 'Geographic Proximity (<200km)', weight: 0.7, default: true },
  { id: 'waitingTime', name: 'Waiting Time (>6m)', weight: 0.9, default: true },
  { id: 'hlaMatch', name: 'HLA Compatibility (Low Mismatch)', weight: 1.0, default: false },
  { id: 'urgency', name: 'Clinical Urgency Score (>70)', weight: 1.0, default: true},
  { id: 'bloodCompat', name: 'Blood Type Exact Match', weight: 1.0, default: true},
];

const mockRecipientData = [
  { patientId: 'RECIP-001', patientNameAnonymized: 'Patient A.K.', bloodType: 'O+', age: 42, waiting: '8 months', distance: '12 km', status: 'Ready', matchPercent: 94, hlaMismatch: 2, riskScore: 'Low', urgency: 'High' },
  { patientId: 'RECIP-002', patientNameAnonymized: 'Patient S.R.', bloodType: 'O+', age: 35, waiting: '1 year', distance: '45 km', status: 'Ready', matchPercent: 89, hlaMismatch: 1, riskScore: 'Low', urgency: 'Medium' },
  { patientId: 'RECIP-003', patientNameAnonymized: 'Patient M.D.', bloodType: 'A+', age: 51, waiting: '3 months', distance: '8 km', status: 'Preparing', matchPercent: 82, hlaMismatch: 3, riskScore: 'Medium', urgency: 'High' },
];

const OrganMatching = () => {
  const [availableOrgans, setAvailableOrgans] = useState([]);
  const [selectedOrganForMatching, setSelectedOrganForMatching] = useState(null);
  const [loadingOrgans, setLoadingOrgans] = useState(true);
  
  const [availableFactors, setAvailableFactors] = useState([]);
  const [selectedFactorIds, setSelectedFactorIds] = useState([]);
  const [potentialRecipients, setPotentialRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [rerunLoading, setRerunLoading] = useState(false); // For the "Apply Factors" button
  
  const [selectedRecipientForModal, setSelectedRecipientForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState({ text: '', type: '' });

  // Fetch available organs and AI factors on component mount
  useEffect(() => {
    const initialLoad = async () => {
        setLoadingOrgans(true);
        try {
            const [organsData, factorsData] = await Promise.all([
                getAvailableOrgansForMatching(),
                getMatchingFactors() // Use mock if service not ready
            ]);
            setAvailableOrgans(organsData || []);
            setAvailableFactors(factorsData || mockAvailableFactors); // Fallback to mock
            setSelectedFactorIds((factorsData || mockAvailableFactors).filter(f => f.default).map(f => f.id));
        } catch (error) {
            console.error("Failed to load initial matching data:", error);
            setAvailableOrgans([]);
            setAvailableFactors(mockAvailableFactors); // Fallback to mock on error
            setSelectedFactorIds(mockAvailableFactors.filter(f => f.default).map(f => f.id));
            setConfirmationMessage({text: "Error loading initial data: " + (error.response?.data?.message || error.message), type: 'error'});
        } finally {
            setLoadingOrgans(false);
        }
    };
    initialLoad();
  }, []);

  // Fetch recipients when a new organ is selected or factors change
  const fetchAndProcessRecipients = useCallback(async (factorsToUse) => {
    if (!selectedOrganForMatching || !selectedOrganForMatching.id) {
        setPotentialRecipients([]);
        setLoadingRecipients(false);
        return;
    }
    setLoadingRecipients(true);
    setConfirmationMessage({text: '', type: ''}); // Clear previous messages
    try {
      // Prepare factors to send (could be just IDs or full factor objects)
      const factorsPayload = factorsToUse.map(id => availableFactors.find(f=>f.id===id)).filter(Boolean);
      
      // Actual API call:
      // const data = await getPotentialRecipientsForOrgan(selectedOrganForMatching.id, factorsPayload);
      // setPotentialRecipients(data.matches || []); 

      // Mock API call:
      console.log("Simulating AI match for Organ ID:", selectedOrganForMatching.id, "with factors:", factorsPayload);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      let simulatedRecipients = mockRecipientData
        .filter(r => { // Basic blood type compatibility (O can give to A/B/AB, A to A/AB, B to B/AB, AB to AB)
            const donorBT = selectedOrganForMatching.bloodType.toUpperCase();
            const recipientBT = r.bloodType.toUpperCase();
            if (donorBT === "O+" || donorBT === "O-") return true;
            if (donorBT === "A+" || donorBT === "A-") return recipientBT.startsWith("A") || recipientBT.startsWith("AB");
            if (donorBT === "B+" || donorBT === "B-") return recipientBT.startsWith("B") || recipientBT.startsWith("AB");
            if (donorBT === "AB+" || donorBT === "AB-") return recipientBT.startsWith("AB");
            return false;
        })
        .map(r => {
            let baseScore = Math.floor(Math.random() * 30) + 60; // Base score 60-89
            if (factorsToUse.includes('age') && Math.abs(r.age - (selectedOrganForMatching.donorAge || 30)) > 15) baseScore -= 10;
            if (factorsToUse.includes('distance') && parseInt(r.distance) > 100) baseScore -= 5;
            if (factorsToUse.includes('hlaMatch') && r.hlaMismatch > 2) baseScore -= 15;
            if (factorsToUse.includes('urgency') && r.urgency === 'Low') baseScore -= 10;
            return {...r, matchPercent: Math.max(50, Math.min(99, Math.round(baseScore))) };
        })
        .sort((a,b) => b.matchPercent - a.matchPercent);
      
      if (simulatedRecipients.length > 0) {
        simulatedRecipients = simulatedRecipients.map((r, index) => ({...r, isBestMatch: index === 0}));
      }
      setPotentialRecipients(simulatedRecipients);

    } catch (error) {
      console.error("Failed to fetch recipients for selected organ:", error);
      setPotentialRecipients([]);
      setConfirmationMessage({text: "Error fetching recipient matches: " + (error.response?.data?.message || error.message), type: 'error'});
    } finally {
      setLoadingRecipients(false);
      setRerunLoading(false);
    }
  }, [selectedOrganForMatching, availableFactors]);

  useEffect(() => {
    if (selectedOrganForMatching) {
        fetchAndProcessRecipients(selectedFactorIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganForMatching]); // Re-fetch ONLY when organ changes initially; factors handled by button

  const handleFactorToggle = (factorId) => {
    setSelectedFactorIds(prev =>
      prev.includes(factorId) ? prev.filter(fId => fId !== factorId) : [...prev, factorId]
    );
  };

  const handleRerunOptimization = () => {
    if (!selectedOrganForMatching) {
        setConfirmationMessage({text: "Please select an organ first to apply factors.", type: "error"});
        return;
    }
    setRerunLoading(true);
    fetchAndProcessRecipients(selectedFactorIds); // This will use the current selectedFactorIds
  };

  const handleViewRecipientDetails = (patientId) => {
    const recipient = potentialRecipients.find(p => p.patientId === patientId);
    setSelectedRecipientForModal(recipient);
    setIsModalOpen(true);
  };

  const handleConfirmMatch = async (recipientId) => {
    if (!selectedOrganForMatching) {
      setConfirmationMessage({text: "Error: No organ selected for confirmation.", type: 'error'});
      return;
    }
    if(window.confirm(`Are you sure you want to confirm match for Recipient ${recipientId} with Organ ${selectedOrganForMatching.type} (Chain ID: ${selectedOrganForMatching.id})? This action will allocate the organ.`)) {
        setRerunLoading(true); // Reuse loading state for confirm button
        setConfirmationMessage({text: 'Processing match confirmation and initiating transfer...', type: 'info'});
        try {
            const response = await confirmMatchAndInitiateTransfer(
                selectedOrganForMatching.id, // This should be the organ's blockchain ID (uint256)
                recipientId, // This is the internal patient ID
                `AI-assisted match confirmation for Organ ${selectedOrganForMatching.id} with Recipient ${recipientId}`
            );
            setConfirmationMessage({text: response.message || `Match confirmed! Tracking ID: ${response.trackingId}`, type: 'success'});
            setIsModalOpen(false);
            // Refresh available organs and clear selection
            setAvailableOrgans(prev => prev.filter(org => org.id !== selectedOrganForMatching.id));
            setSelectedOrganForMatching(null);
            setPotentialRecipients([]);
        } catch (error) {
            setConfirmationMessage({text: `Error confirming match: ${error.response?.data?.message || error.message}`, type: 'error'});
        } finally {
            setRerunLoading(false);
        }
    }
  };

  return (
    <div className="organ-matching-page">
      <div className="page-header-controls">
        <div>
            <h3>AI-Powered Organ Matching</h3>
            {selectedOrganForMatching ? (
                <p className='mb-0 page-subtitle-text'>
                    Matching Organ: <strong>{selectedOrganForMatching.type} (Chain ID: {selectedOrganForMatching.id})</strong>
                    <br/>
                    <small>Donor DID: {selectedOrganForMatching.donorDid} | Blood: {selectedOrganForMatching.bloodType} | Donor Age: {selectedOrganForMatching.donorAge}</small>
                </p>
            ) : (
                <p className='mb-0 page-subtitle-text'>Select an available organ from the list below to find potential recipient matches.</p>
            )}
        </div>
        {selectedOrganForMatching && 
            <Button onClick={() => { setSelectedOrganForMatching(null); setPotentialRecipients([]); setConfirmationMessage({text: '', type: ''}); }} className="btn-outline btn-sm">
                Change Organ
            </Button>
        }
      </div>
      
      {confirmationMessage.text && <div className={`form-message ${confirmationMessage.type}`}>{confirmationMessage.text}</div>}

      {!selectedOrganForMatching ? (
        <div className="available-organs-selector card">
            <h4>Available Organs for Matching</h4>
            {loadingOrgans ? <div className="text-center p-3"><LoadingSpinner /></div> : 
             availableOrgans.length === 0 ? <p className="text-center p-3">No organs currently available for matching from your hospital/network.</p> : (
                <ul className="organ-select-list">
                    {availableOrgans.map(org => (
                        <li key={org.id} onClick={() => handleSelectOrganForMatching(org)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleSelectOrganForMatching(org)}>
                            <strong>{org.type} (Chain ID: {org.id})</strong>
                            <div><small>Donor: {org.donorDid}, Blood: {org.bloodType}, Donor Age: {org.donorAge}</small></div>
                            <div><small>Recovered: {new Date(org.recoveryTime).toLocaleString()}</small></div>
                            <div><small>Recovery Hospital: {org.recoveryHospitalDid}</small></div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      ) : (
        <div className="matching-layout">
          <div className="matching-factors-panel card">
            <h4>Refine Matching Factors</h4>
            <p>Select factors for AI consideration. Weights can be adjusted by system administrators.</p>
            <div className="factors-list">
              {availableFactors.map(factor => (
                <div key={factor.id} className="factor-item">
                  <input 
                      type="checkbox" 
                      id={`factor-${factor.id}`} 
                      checked={selectedFactorIds.includes(factor.id)}
                      onChange={() => handleFactorToggle(factor.id)}
                  />
                  <label htmlFor={`factor-${factor.id}`}>{factor.name}</label>
                </div>
              ))}
            </div>
            <Button 
                onClick={handleRerunOptimization} 
                className="btn-primary btn-rerun" 
                disabled={rerunLoading || selectedFactorIds.length === 0 || loadingRecipients}
            >
              {rerunLoading ? <LoadingSpinner size="20px" color="#fff" thickness="2px"/> : 'Apply Factors & Re-calculate'}
            </Button>
          </div>

          <div className="potential-recipients-panel card">
            <h4>Potential Recipient Matches ({potentialRecipients.length})</h4>
            {loadingRecipients ? (
              <div className="text-center p-5"><LoadingSpinner size="50px" /></div>
            ) : potentialRecipients.length === 0 ? (
                <p className="text-center p-3">No potential recipients found for <strong>{selectedOrganForMatching.type} (ID: {selectedOrganForMatching.id})</strong> with the current factors. Try adjusting factors or check back later.</p>
            ) : (
              <div className="recipients-table-container">
                  <table className="recipients-table">
                      <thead>
                      <tr>
                          <th>Patient ID</th>
                          <th>Anonymized Name</th>
                          <th>Blood</th>
                          <th>Age</th>
                          <th>Waiting Time</th>
                          <th>Urgency</th>
                          <th>Match %</th>
                          <th>Action</th>
                      </tr>
                      </thead>
                      <tbody>
                      {potentialRecipients.map(patient => (
                          <RecipientTableRow 
                              key={patient.patientId} 
                              patient={patient}
                              onViewDetails={() => handleViewRecipientDetails(patient.patientId)}
                          />
                      ))}
                      </tbody>
                  </table>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && selectedRecipientForModal && selectedOrganForMatching && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Review Match: Recipient ${selectedRecipientForModal.patientId}`}>
            <div className="recipient-details-modal">
                <p><strong>Recipient Anonymized Name:</strong> {selectedRecipientForModal.patientNameAnonymized || 'N/A'}</p>
                <p><strong>Blood Type:</strong> {selectedRecipientForModal.bloodType}</p>
                <p><strong>Age:</strong> {selectedRecipientForModal.age}</p>
                <p><strong>Waiting Time:</strong> {selectedRecipientForModal.waiting}</p>
                <p><strong>Distance from Donor:</strong> {selectedRecipientForModal.distance || 'N/A'}</p>
                <p><strong>HLA Mismatches:</strong> {selectedRecipientForModal.hlaMismatch ?? 'N/A'}</p>
                <p><strong>Risk Score:</strong> {selectedRecipientForModal.riskScore || 'N/A'}</p>
                <p><strong>Clinical Urgency:</strong> {selectedRecipientForModal.urgency || 'N/A'}</p>
                <p style={{color: '#007bff', fontWeight: 'bold'}}><strong>AI Match Score:</strong> {selectedRecipientForModal.matchPercent}%</p>
                <hr />
                <p><strong>Matching with Organ:</strong> {selectedOrganForMatching.type} (Chain ID: {selectedOrganForMatching.id})</p>
                <p><strong>Donor Blood Type:</strong> {selectedOrganForMatching.bloodType}, <strong>Donor Age:</strong> {selectedOrganForMatching.donorAge}</p>
                <p><strong>Recovery Hospital DID:</strong> {selectedOrganForMatching.recoveryHospitalDid}</p>
            </div>
            <div className="modal-footer" style={{justifyContent: 'space-between'}}>
                 <Button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button 
                    className="btn-primary" 
                    onClick={() => handleConfirmMatch(selectedRecipientForModal.patientId)}
                    disabled={rerunLoading}
                 >
                    {rerunLoading ? <LoadingSpinner size="20px" color="#fff"/> : 'Confirm Match & Initiate Transfer'}
                </Button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default OrganMatching;