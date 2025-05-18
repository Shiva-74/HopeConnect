import React, { useState, useEffect, useCallback } from 'react';
// import PageTitle from '../../components/Common/PageTitle'; // Title usually from parent layout
import Button from '../../components/Common/Button';
import RecipientTableRow from '../../components/Dashboard/RecipientTableRow';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Modal from '../../components/Common/Modal'; // For detailed view or actions
// import { getPotentialRecipients, rerunAiOptimization, getMatchingFactors, confirmMatch } from '../../services/hospitalService';
import './OrganMatching.css'; // Make sure this CSS file exists

// Mock Data
const mockAvailableFactors = [ // Could be fetched from backend
  { id: 'age', name: 'Age Compatibility', weight: 0.8, default: true },
  { id: 'distance', name: 'Geographic Proximity', weight: 0.7, default: true },
  { id: 'waitingTime', name: 'Waiting Time', weight: 0.9, default: true },
  { id: 'hlaMatch', name: 'HLA Compatibility', weight: 1.0, default: false },
  { id: 'riskScore', name: 'Recipient Risk Score', weight: 0.6, default: false },
  { id: 'coldIschemia', name: 'Est. Cold Ischemia Time', weight: 0.9, default: true },
  { id: 'urgency', name: 'Clinical Urgency', weight: 1.0, default: false},
];

const mockRecipients = [
  { patientId: 'RECIP-001', patientName: 'Aarav Kumar', isBestMatch: true, bloodType: 'O+', age: 42, waiting: '8 months', distance: '12 km', status: 'Ready', matchPercent: 94, hlaMismatch: 2, riskScore: 'Low', urgency: 'High' },
  { patientId: 'RECIP-002', patientName: 'Sneha Reddy', bloodType: 'O+', age: 35, waiting: '1 year', distance: '45 km', status: 'Ready', matchPercent: 89, hlaMismatch: 1, riskScore: 'Low', urgency: 'Medium' },
  { patientId: 'RECIP-003', patientName: 'Manish Desai', bloodType: 'A+', age: 51, waiting: '3 months', distance: '8 km', status: 'Preparing', matchPercent: 82, hlaMismatch: 3, riskScore: 'Medium', urgency: 'High' },
  { patientId: 'RECIP-004', patientName: 'Kavya Lal', bloodType: 'B-', age: 28, waiting: '2 years', distance: '120 km', status: 'Ready', matchPercent: 78, hlaMismatch: 0, riskScore: 'Low', urgency: 'Low' },
  { patientId: 'RECIP-005', patientName: 'Bhavin Vyas', bloodType: 'AB+', age: 63, waiting: '6 months', distance: '15 km', status: 'Ready', matchPercent: 71, hlaMismatch: 4, riskScore: 'High', urgency: 'Medium' },
];

// Assume a donor organ is available for matching
const currentDonorOrgan = {
    id: "DONOR-ORG-LIV-001",
    type: "Liver",
    bloodType: "O+",
    donorAge: 30,
    retrievalTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
};


const OrganMatching = () => {
  const [availableFactors, setAvailableFactors] = useState(mockAvailableFactors);
  const [selectedFactorIds, setSelectedFactorIds] = useState(
    mockAvailableFactors.filter(f => f.default).map(f => f.id)
  );
  const [potentialRecipients, setPotentialRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null); // For modal view
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donorOrgan, setDonorOrgan] = useState(currentDonorOrgan); // Current organ being matched


  const fetchAndProcessRecipients = useCallback(async (factorsToUse) => {
    setLoading(true); // Use main loading for full re-fetch
    try {
      // const factorsPayload = factorsToUse.map(id => availableFactors.find(f=>f.id===id));
      // const data = await getPotentialRecipients(donorOrgan.id, factorsPayload);
      // setPotentialRecipients(data);
      
      // Simulate API call with mock data & factor influence
      await new Promise(resolve => setTimeout(resolve, 700)); 
      let simulatedRecipients = mockRecipients
        .filter(r => r.bloodType === donorOrgan.bloodType || donorOrgan.bloodType === "O+" || r.bloodType === "AB+") // Basic blood type compatibility
        .map(r => {
            let baseScore = r.matchPercent;
            // Adjust score based on selected factors (very simplified simulation)
            if (!factorsToUse.includes('age')) baseScore -= 5;
            if (!factorsToUse.includes('distance') && parseInt(r.distance) > 50) baseScore -= 8;
            if (!factorsToUse.includes('hlaMatch') && r.hlaMismatch > 2) baseScore -= 10;
            if (!factorsToUse.includes('urgency') && r.urgency === 'Low') baseScore -= 5;
            return {...r, matchPercent: Math.max(50, Math.min(99, Math.round(baseScore + (Math.random()*6-3)))) }; // Clamp score
        })
        .sort((a,b) => b.matchPercent - a.matchPercent);
      
      if (simulatedRecipients.length > 0) {
        simulatedRecipients = simulatedRecipients.map((r, index) => ({...r, isBestMatch: index === 0}));
      }
      setPotentialRecipients(simulatedRecipients);

    } catch (error) {
      console.error("Failed to fetch recipients:", error);
      setPotentialRecipients([]);
    } finally {
      setLoading(false);
      setRerunLoading(false);
    }
  }, [donorOrgan]); // Add donorOrgan dependency

  useEffect(() => {
    // Fetch available factors on mount (if dynamic)
    // const fetchFactors = async () => { 
    //   const factors = await getMatchingFactors(); 
    //   setAvailableFactors(factors);
    //   setSelectedFactorIds(factors.filter(f => f.default).map(f => f.id));
    // }
    // fetchFactors();
    if (donorOrgan) { // Initial load of recipients
        fetchAndProcessRecipients(selectedFactorIds);
    } else {
        setLoading(false); // No organ to match
    }
  }, [selectedFactorIds, fetchAndProcessRecipients, donorOrgan]);

  const handleFactorToggle = (factorId) => {
    setSelectedFactorIds(prev =>
      prev.includes(factorId) ? prev.filter(fId => fId !== factorId) : [...prev, factorId]
    );
  };

  const handleRerunOptimization = () => {
    setRerunLoading(true); // Use specific loading for rerun button
    fetchAndProcessRecipients(selectedFactorIds);
  };

  const handleViewRecipientDetails = (patientId) => {
    const recipient = potentialRecipients.find(p => p.patientId === patientId);
    setSelectedRecipient(recipient);
    setIsModalOpen(true);
  };

  const handleConfirmMatch = async (recipientId) => {
    if(window.confirm(`Are you sure you want to confirm match for ${recipientId} with organ ${donorOrgan.id}? This action may be irreversible.`)) {
        // await confirmMatch(donorOrgan.id, recipientId);
        alert(`Match confirmed for ${recipientId} with ${donorOrgan.id}. System is processing allocation.`);
        setIsModalOpen(false);
        // Potentially refresh or update UI
        fetchAndProcessRecipients(selectedFactorIds); // Re-fetch to update status
    }
  };

  if (!donorOrgan && !loading) {
    return (
      <div className="organ-matching-page">
        <h3>AI-Powered Organ Matching</h3>
        <p className="card text-center p-3">No donor organ is currently selected or available for matching.</p>
        {/* UI to select a donor organ could go here */}
      </div>
    );
  }


  return (
    <div className="organ-matching-page">
      <div className="page-header-controls">
        <div>
            <h3>AI-Powered Organ Matching</h3>
            <p className='mb-0 page-subtitle-text'>
                Matching Organ: <strong>{donorOrgan.type} (ID: {donorOrgan.id})</strong> from Donor (Age: {donorOrgan.donorAge}, Blood: {donorOrgan.bloodType})
            </p>
        </div>
      </div>
      
      <div className="matching-layout">
        <div className="matching-factors-panel card">
          <h4>Refine Matching Factors</h4>
          <p>Select factors for AI consideration. Weights indicate relative importance (editable by admin).</p>
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
                {/* <span className="factor-weight">(Weight: {factor.weight})</span> */}
              </div>
            ))}
          </div>
          <Button 
              onClick={handleRerunOptimization} 
              className="btn-primary btn-rerun" 
              disabled={rerunLoading || selectedFactorIds.length === 0}
          >
            {rerunLoading ? <LoadingSpinner size="20px" color="#fff" thickness="2px"/> : 'Apply Factors & Re-calculate Matches'}
          </Button>
        </div>

        <div className="potential-recipients-panel card">
          <h4>Potential Recipient Matches ({potentialRecipients.length})</h4>
          {loading ? (
            <div className="text-center p-5"><LoadingSpinner size="50px" /></div>
          ) : potentialRecipients.length === 0 ? (
              <p className="text-center p-3">No potential recipients found based on the current organ and factor selection.</p>
          ) : (
            <div className="recipients-table-container">
                <table className="recipients-table">
                    <thead>
                    <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Blood</th>
                        <th>Age</th>
                        <th>Waiting</th>
                        <th>Distance</th>
                        <th>Status</th>
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

      {isModalOpen && selectedRecipient && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Recipient Details: ${selectedRecipient.patientName} (${selectedRecipient.patientId})`}>
            <div className="recipient-details-modal">
                <p><strong>Blood Type:</strong> {selectedRecipient.bloodType}</p>
                <p><strong>Age:</strong> {selectedRecipient.age}</p>
                <p><strong>Waiting Time:</strong> {selectedRecipient.waiting}</p>
                <p><strong>Distance from Donor:</strong> {selectedRecipient.distance}</p>
                <p><strong>Current Status:</strong> {selectedRecipient.status}</p>
                <p><strong>AI Match Score:</strong> {selectedRecipient.matchPercent}%</p>
                <p><strong>HLA Mismatches:</strong> {selectedRecipient.hlaMismatch}</p>
                <p><strong>Risk Score:</strong> {selectedRecipient.riskScore}</p>
                <p><strong>Clinical Urgency:</strong> {selectedRecipient.urgency}</p>
                {/* Add more detailed information as needed */}
                <hr />
                <p>Matching with Organ: <strong>{donorOrgan.type} (ID: {donorOrgan.id})</strong></p>
            </div>
            <div className="modal-footer" style={{justifyContent: 'space-between'}}>
                 <Button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                 <Button className="btn-primary" onClick={() => handleConfirmMatch(selectedRecipient.patientId)}>
                    Confirm Match & Initiate Allocation
                </Button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default OrganMatching;