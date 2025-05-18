import api from './api';

export const getTokenBalanceForUser = async () => {
  try {
    const response = await api.get('/tokens/balance');
    return response.data; // Expects { ethAddress: '...', balance: '...' }
  } catch (error) {
    console.error("Error fetching token balance:", error.response?.data?.message || error.message);
    throw error;
  }
};

export const getAvailableIncentives = async () => {
    try {
        // const response = await api.get('/incentives/available'); // Actual API
        // return response.data;

        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 300));
        return [
          { id: 'incentive1', name: 'Priority Health Check-up Voucher', cost: 50, description: 'Get a voucher for a priority slot at a partner hospital.' },
          { id: 'incentive2', name: 'Wellness Package Discount (20%)', cost: 100, description: 'Receive a 20% discount for wellness packages.' },
          { id: 'incentive3', name: 'HopeConnect Merchandise Pack', cost: 25, description: 'Exclusive HopeConnect branded items.' },
          { id: 'incentive4', name: 'Plant a Tree in Your Name', cost: 10, description: 'A tree planted as a symbol of life.' },
        ];
    } catch (error) {
        console.error("Error fetching available incentives:", error.response?.data?.message || error.message);
        throw error;
    }
};

export const redeemTokensForIncentive = async (incentiveId, amountToRedeem, incentiveDetails = {}) => {
    try {
        // No userId needed in payload, backend gets it from auth token
        const response = await api.post('/tokens/redeem', { 
            amountToRedeem, 
            incentiveType: incentiveId, 
            incentiveDetails
        });
        return response.data; // Expects { message, burnTransactionHash, newBalance }
    } catch (error) {
        console.error("Error redeeming tokens:", error.response?.data?.message || error.message);
        throw error; // Let component handle displaying the error
    }
};