import api from './api';

export const registerAsDonor = async (donorData) => {
  try {
    // const response = await api.post('/donors/pledge', donorData); // Example endpoint for pledging
    // return response.data;

    // Mock implementation:
    console.log("Simulating donor pledge registration:", donorData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (donorData.email.includes('failpledge')) {
        const error = new Error('Pledge registration failed');
        // @ts-ignore
        error.response = { data: { message: 'There was an issue processing your pledge. Please try again. (mock fail)' }, status: 400 };
        throw error;
    }
    return { message: 'Your pledge has been successfully recorded. Thank you!', pledgeId: `PLEDGE-${Date.now()}` };

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Pledge registration failed.';
    const newError = new Error(errorMessage);
    // @ts-ignore
    newError.response = error.response;
    throw newError;
  }
};

export const getDonorProfile = async (userIdOrDonorId) => { // Backend decides if it's user ID or specific donor ID
    try {
        // const response = await api.get(`/donors/profile/${userIdOrDonorId}`);
        // return response.data;

        // Mock implementation:
        console.log("Simulating fetching donor profile for:", userIdOrDonorId);
        await new Promise(resolve => setTimeout(resolve, 700));
        // Re-using mockProfile from DonorProfilePage.js for consistency in dev
        const mockProfileData = {
            fullName: "Aanya Sharma",
            email: "aanya.s@example.com", // This might be the key if userIdOrDonorId is email for mock
            donorId: "DONOR123",
            dateRegistered: "2024-01-15T10:00:00Z",
            organsPledged: ["Heart", "Lungs", "Liver", "Kidneys", "Corneas"],
            contactNumber: "+91 9876543210",
            address: "123 Hope Street, New Delhi, Delhi 110001",
            bloodGroup: "O+",
            dob: "1985-07-22T00:00:00Z",
        };
        // Simple check for mock
        if (userIdOrDonorId === mockProfileData.email || userIdOrDonorId === mockProfileData.donorId || userIdOrDonorId.includes('user-')) {
            return mockProfileData;
        } else {
            const error = new Error('Profile not found');
             // @ts-ignore
            error.response = { data: { message: 'Donor profile not found.' }, status: 404 };
            throw error;
        }

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch donor profile.';
        const newError = new Error(errorMessage);
         // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};

export const getDonorImpact = async (donorSystemId) => { // Usually specific donor ID
    try {
        // const response = await api.get(`/donors/impact/${donorSystemId}`);
        // return response.data;

        // Mock implementation:
        console.log("Simulating fetching donor impact for:", donorSystemId);
        await new Promise(resolve => setTimeout(resolve, 700));
         const mockImpactData = {
            livesSavedDirectly: 2,
            livesEnhancedThroughTissues: 5,
            healthCredits: 1250, 
            thankYouMessages: [
                { from: "Heart Recipient's Family", message: "Words cannot express our gratitude. Your loved one's gift has given my husband a new life.", date: "2025-06-01T14:30:00Z" },
                { from: "Lung Recipient", message: "Because of your selfless act, I can breathe freely. Thank you.", date: "2025-07-10T09:00:00Z" }
            ],
            donationStatusLink: `/track-donation/${donorSystemId}`
        };
        if (donorSystemId === "DONOR123") { // Example mapping
            return mockImpactData;
        } else {
            // Return empty or minimal impact for other IDs in mock
            return { livesSavedDirectly: 0, livesEnhancedThroughTissues: 0, healthCredits: 0, thankYouMessages: [], donationStatusLink: `/track-donation/${donorSystemId}` };
        }

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch donor impact data.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};

export const updateDonorProfile = async (userIdOrDonorId, profileData) => {
    try {
        // const response = await api.put(`/donors/profile/${userIdOrDonorId}`, profileData);
        // return response.data;

        // Mock implementation:
        console.log("Simulating update donor profile for:", userIdOrDonorId, "with data:", profileData);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { message: "Profile updated successfully.", updatedProfile: {...profileData, lastUpdated: new Date().toISOString()} };

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};