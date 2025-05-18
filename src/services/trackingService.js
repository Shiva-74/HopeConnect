import api from './api';

// Mock data used by the TrackDonationPage and DonationAuditTrailPage
const mockTrackingData = {
  'DONOR123': {
    donorId: 'DONOR123',
    donorName: "Aanya Sharma (Deceased Donor)",
    dateOfDonation: '2025-05-14',
    summaryMessage: "Thank you for your noble contribution. The gift of life from Aanya Sharma has touched multiple lives.",
    donations: [
      { organ: 'Heart', icon: '❤️', status: 'Transplanted Successfully', recipientInfo: 'Male, 45 years, AIIMS Delhi', id: 'HT-2025-0547', transplantDate: '2025-05-15' },
      { organ: 'Lungs (Pair)', icon: '🫁', status: 'Transplanted Successfully', recipientInfo: 'Female, 32 years, Fortis Hospital', id: 'LU-2025-0012', transplantDate: '2025-05-16' },
      { organ: 'Liver', icon: '🧡', status: 'Awaiting Transplant', recipientInfo: 'Matched to Patient J.K., Apollo Hospital', id: 'LV-2025-0547', transplantDate: null }, // Note: Reused ID here from audit trail mock
      { organ: 'Kidneys (Pair)', icon: ' किडनी', status: 'One Transplanted, One Matched', recipientInfo: 'Kidney 1: Male, 58; Kidney 2: Female, 29', id: 'KD-2025-1122', transplantDate: '2025-05-17 (Kidney 1)' },
    ],
    retrievalMessage: "Donor information retrieved successfully. This is a simplified view."
  },
};

const mockAuditTrailData = {
  'LV-2025-0547': { // Liver Donation ID from track page example
    donationId: 'LV-2025-0547', organType: 'Liver', donorId: 'DONOR123', donorName: 'Aanya Sharma (Deceased)',
    recipientId: 'RECIP-088', recipientName: 'Patient J.K.', currentStatus: 'Transplant Successful',
    transplantDate: '2025-05-16T08:00:00Z', hospitalName: 'AIIMS Delhi',
    trail: [
      { stepNumber: 1, title: 'Donor Consent Recorded', timestamp: '2025-05-14 09:15:23 UTC', actor: 'System (Hospital A)', details: 'Consent form Ref: CONSENT-XYZ. Hash: 0xabc...def', status: 'completed' },
      { stepNumber: 2, title: 'Organ Recovery', timestamp: '2025-05-15 10:32:05 UTC', actor: 'Surgical Team, Hospital A', details: 'Liver recovered. Quality: Excellent. Blockchain TxID: 0x3bc...197', status: 'completed' },
      { stepNumber: 3, title: 'Transport Initiated', timestamp: '2025-05-15 10:45:12 UTC', actor: 'Logistics (QuickTrans)', details: 'En route to AIIMS Delhi. ETA: 12:00 UTC.', status: 'completed' },
      { stepNumber: 4, title: 'Organ Arrived', timestamp: '2025-05-15 11:55:03 UTC', actor: 'Receiving Team, AIIMS Delhi', details: 'Received. Cold chain: OK (4.2°C).', status: 'completed' },
      { stepNumber: 5, title: 'Transplant Started', timestamp: '2025-05-15 13:00:00 UTC', actor: 'Surgical Team, AIIMS Delhi', details: 'Surgery for RECIP-088 underway.', status: 'completed' },
      { stepNumber: 6, title: 'Transplant Successful', timestamp: '2025-05-15 17:30:45 UTC', actor: 'Surgical Team, AIIMS Delhi', details: 'Completed. Patient stable.', status: 'completed', isExpandedDefault: true },
    ]
  },
   // Add other specific organ IDs if needed, e.g., HT-2025-0547
    'HT-2025-0547': {
        donationId: 'HT-2025-0547', organType: 'Heart', donorId: 'DONOR123', donorName: 'Aanya Sharma (Deceased)',
        recipientId: 'RECIP-XYZ', recipientName: 'Male, 45 years', currentStatus: 'Transplant Successful',
        transplantDate: '2025-05-15T10:00:00Z', hospitalName: 'AIIMS Delhi',
        trail: [ /* ... similar detailed trail for heart ... */ ]
    },
};


export const trackDonationById = async (searchId) => { // searchId can be Donor ID or Organ/Donation Log ID
  try {
    // const response = await api.get(`/tracking/summary/${searchId}`); 
    // return response.data;

    // Mock implementation:
    console.log("Simulating tracking for ID:", searchId);
    await new Promise(resolve => setTimeout(resolve, 700));
    const upperSearchId = searchId.toUpperCase();

    if (mockTrackingData[upperSearchId]) {
        return mockTrackingData[upperSearchId];
    }
    // Check if it's an organ ID within a donor's record
    for (const donorKey in mockTrackingData) {
        const foundOrgan = mockTrackingData[donorKey].donations.find(d => d.id === upperSearchId);
        if (foundOrgan) {
            // Return the parent donor's full record, maybe with a flag for the specific organ
            return { ...mockTrackingData[donorKey], searchedOrganId: upperSearchId };
        }
    }
    const error = new Error('Donation/Organ ID not found');
    // @ts-ignore
    error.response = { data: { message: `No tracking information found for ID ${searchId}.` }, status: 404 };
    throw error;

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to track donation.';
    const newError = new Error(errorMessage);
    // @ts-ignore
    newError.response = error.response;
    throw newError;
  }
};

export const getDonationAuditTrail = async (donationLogId) => { // Specific Organ/Donation Log ID
    try {
        // const response = await api.get(`/tracking/audit-trail/${donationLogId}`);
        // return response.data;

        // Mock implementation:
        console.log("Simulating fetching audit trail for:", donationLogId);
        await new Promise(resolve => setTimeout(resolve, 700));
        const upperLogId = donationLogId.toUpperCase();

        if (mockAuditTrailData[upperLogId]) {
            return mockAuditTrailData[upperLogId];
        } else {
             // Fallback for IDs present in main tracking data but not detailed audit trail
            for (const donorKey in mockTrackingData) {
                const organ = mockTrackingData[donorKey].donations.find(d => d.id === upperLogId);
                if (organ) {
                    return { // Construct a minimal audit trail if not fully mocked
                        donationId: organ.id, organType: organ.organ, donorId: donorKey, 
                        donorName: mockTrackingData[donorKey].donorName, 
                        recipientName: organ.recipientInfo, currentStatus: organ.status,
                        trail: [
                            { stepNumber: 1, title: `Organ Status: ${organ.status}`, timestamp: new Date().toISOString(), actor: 'System', details: 'Basic status update from tracking data.', status: 'completed' }
                        ]
                    };
                }
            }
            const error = new Error('Audit trail not found');
            // @ts-ignore
            error.response = { data: { message: `No audit trail found for ID ${donationLogId}.` }, status: 404 };
            throw error;
        }

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to retrieve audit trail.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};