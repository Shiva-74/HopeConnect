import api from './api';
// import { aiApi } from './api'; // If AI calls are separate

export const searchDonorsForHospital = async (searchParams) => {
    try {
        const response = await api.get('/donors/list-for-hospital', { params: searchParams });
        return response.data;
    } catch (error) {
        console.error("Error searching donors for hospital:", error.response?.data?.message || error.message);
        throw error;
    }
};

export const registerOrganForExistingDonor = async (organData) => {
    // organData: { donorDid, organType, recoveryHospitalDid (can be optional if derived from user), recoveryNotes }
    try {
        const response = await api.post('/hospital/register-organ', organData);
        return response.data; // Expects { message, organIdBlockchain, transactionHash, donorProfileId }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to register organ.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};

export const updateDonorHealthByHospitalStaff = async (donorDbId, healthData) => {
    try {
        const response = await api.put(`/hospital/donor-health/${donorDbId}`, healthData);
        return response.data; // Expects { message, donor }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update donor health.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};



export const registerHospital = async (hospitalData) => {
  try {
    // const response = await api.post('/hospitals/apply-partnership', hospitalData);
    // return response.data;

    // Mock implementation:
    console.log("Simulating hospital partnership application:", hospitalData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (hospitalData.hospitalName.toLowerCase().includes('fail')) {
        const error = new Error('Application submission failed');
        // @ts-ignore
        error.response = { data: { message: 'There was an issue submitting your application (mock fail).' }, status: 400 };
        throw error;
    }
    return { message: 'Hospital partnership application submitted successfully. Our team will review and contact you.', applicationId: `HOSP-APP-${Date.now()}` };

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Hospital partnership application failed.';
    const newError = new Error(errorMessage);
    // @ts-ignore
    newError.response = error.response;
    throw newError;
  }
};

export const getPotentialRecipients = async (donorOrganId, selectedFactors) => {
    try {
        // This might call your AI service via the backend, or directly if configured
        // const response = await api.post(`/matching/recipients`, { donorOrganId, factors: selectedFactors }); 
        // Or: const response = await aiApi.post('/match', { donorOrganId, factors: selectedFactors });
        // return response.data; // Expecting an array of recipient objects

        // Mock implementation:
        console.log("Simulating fetching potential recipients for organ:", donorOrganId, "with factors:", selectedFactors);
        await new Promise(resolve => setTimeout(resolve, 700));
        
        const mockRecipientsList = [ // From OrganMatchingPage.js
            { patientId: 'RECIP-001', patientName: 'Aarav Kumar', isBestMatch: true, bloodType: 'O+', age: 42, waiting: '8 months', distance: '12 km', status: 'Ready', matchPercent: 94, hlaMismatch: 2, riskScore: 'Low', urgency: 'High' },
            { patientId: 'RECIP-002', patientName: 'Sneha Reddy', bloodType: 'O+', age: 35, waiting: '1 year', distance: '45 km', status: 'Ready', matchPercent: 89, hlaMismatch: 1, riskScore: 'Low', urgency: 'Medium' },
            { patientId: 'RECIP-003', patientName: 'Manish Desai', bloodType: 'A+', age: 51, waiting: '3 months', distance: '8 km', status: 'Preparing', matchPercent: 82, hlaMismatch: 3, riskScore: 'Medium', urgency: 'High' },
        ];
        
        // Simplified filtering for mock based on donorOrganId (not really, just returning the list)
        // And slightly randomizing matchPercent based on factors length for demo
        return mockRecipientsList.map(r => ({
            ...r,
            matchPercent: Math.max(50, Math.min(99, Math.round(r.matchPercent - (5 - selectedFactors.length) * (Math.random() * 3))))
        })).sort((a,b) => b.matchPercent - a.matchPercent)
           .map((r, idx) => ({...r, isBestMatch: idx === 0}));


    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch potential recipients.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};

export const getMatchingFactors = async () => {
    try {
        // const response = await api.get('/matching/factors');
        // return response.data; // Expecting array of factor objects {id, name, weight, default}

        // Mock implementation:
        console.log("Simulating fetching matching factors");
        await new Promise(resolve => setTimeout(resolve, 300));
        return [ // From OrganMatchingPage.js
            { id: 'age', name: 'Age Compatibility', weight: 0.8, default: true },
            { id: 'distance', name: 'Geographic Proximity', weight: 0.7, default: true },
            { id: 'waitingTime', name: 'Waiting Time', weight: 0.9, default: true },
            { id: 'hlaMatch', name: 'HLA Compatibility', weight: 1.0, default: false },
            { id: 'riskScore', name: 'Recipient Risk Score', weight: 0.6, default: false },
            { id: 'coldIschemia', name: 'Est. Cold Ischemia Time', weight: 0.9, default: true },
            { id: 'urgency', name: 'Clinical Urgency', weight: 1.0, default: false},
        ];

    } catch (error) {
        throw error; // Let caller handle
    }
};


export const confirmMatchAndInitiateAllocation = async (donorOrganId, recipientId, allocationNotes = "") => {
    try {
        // const response = await api.post('/matching/confirm-allocation', { donorOrganId, recipientId, notes: allocationNotes });
        // return response.data;

        // Mock implementation:
        console.log(`Simulating confirm match: Organ ${donorOrganId} with Recipient ${recipientId}. Notes: ${allocationNotes}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: `Allocation initiated for Organ ${donorOrganId} to Recipient ${recipientId}. Logistics team notified.`, allocationId: `ALLOC-${Date.now()}` };

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to confirm match and initiate allocation.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};

// Add more hospital-related API calls:
// - Fetch hospital dashboard stats
// - Manage patient waiting lists
// - Submit new organ requests (if hospital can do that)
// - Update transplant outcomes