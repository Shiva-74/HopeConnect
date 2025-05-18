import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom'; // <--- CORRECTED IMPORT
import PageTitle from '../../components/Common/PageTitle';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { getTokenBalanceForUser, getAvailableIncentives, redeemTokensForIncentive } from '../../services/tokenService';
import './RedemptionPage.css'; // Ensure this CSS file exists

const RedemptionPage = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState('0');
    const [incentives, setIncentives] = useState([]);
    // const [selectedIncentive, setSelectedIncentive] = useState(null); // Kept for potential modal
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [loadingIncentives, setLoadingIncentives] = useState(true);
    const [redeeming, setRedeeming] = useState(null); // Store incentive ID being redeemed
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchBalanceAndIncentives = async () => {
            if (user?.ethAddress) {
                setLoadingBalance(true);
                try {
                    const balanceData = await getTokenBalanceForUser();
                    setBalance(balanceData.balance);
                } catch (error) {
                    setMessage({ text: 'Failed to fetch token balance. ' + (error.response?.data?.message || error.message) , type: 'error' });
                } finally {
                    setLoadingBalance(false);
                }
            } else if (user) { 
                setMessage({ text: 'Please set your Ethereum address in your profile to redeem tokens.', type: 'error' });
                setLoadingBalance(false);
            }

            setLoadingIncentives(true);
            try {
                const incentivesData = await getAvailableIncentives();
                setIncentives(incentivesData);
            } catch (error) {
                setMessage({ text: 'Failed to fetch available incentives. ' + (error.response?.data?.message || error.message), type: 'error' });
            } finally {
                setLoadingIncentives(false);
            }
        };

        if(user) { 
            fetchBalanceAndIncentives();
        } else {
            // If user is null (e.g., after logout or if auth is still loading initially), set loading to false.
            // The protect route should handle redirection if not authenticated.
            setLoadingBalance(false);
            setLoadingIncentives(false);
        }
    }, [user]);

    const handleRedeem = async (incentive) => {
        if (!user || !user.ethAddress) {
            setMessage({ text: 'User ETH address not found. Cannot redeem.', type: 'error' });
            return;
        }
        if (parseFloat(balance) < incentive.cost) {
            setMessage({ text: 'Insufficient balance to redeem this incentive.', type: 'error' });
            return;
        }

        if (!window.confirm(`Are you sure you want to redeem "${incentive.name}" for ${incentive.cost} HOPE tokens?`)) {
            return;
        }

        setRedeeming(incentive.id);
        setMessage({ text: '', type: '' });
        try {
            const response = await redeemTokensForIncentive(incentive.id, incentive.cost, { incentiveName: incentive.name });
            setMessage({ text: response.message || 'Redemption successful! Your new balance will update shortly.', type: 'success' });
            
            if (user?.ethAddress) {
                const balanceData = await getTokenBalanceForUser();
                setBalance(balanceData.balance);
            }
        } catch (error) {
            setMessage({ text: error.response?.data?.message || error.message || 'Redemption failed.', type: 'error' });
        } finally {
            setRedeeming(null);
        }
    };

    // This check should ideally be handled by ProtectedRoute, but good for robustness
    if (!user && !loadingBalance && !loadingIncentives) { 
        return <Navigate to="/login" state={{ from: '/dashboard/redeem-tokens' }} replace />;
    }


    return (
        <div className="redemption-page container">
            <PageTitle title="Redeem HopeTokens" subtitle="Use your earned tokens for exclusive benefits and support." />

            {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}

            <div className="balance-display card">
                <h3>Your HopeToken Balance</h3>
                {loadingBalance ? <LoadingSpinner size="30px" /> : 
                    user?.ethAddress ? <h2>{parseFloat(balance).toLocaleString()} HOPE</h2> : <p>Please set your ETH address in your profile to view balance and redeem tokens.</p>
                }
            </div>

            <div className="incentives-list">
                <h3>Available Incentives</h3>
                {loadingIncentives ? <div className="text-center p-5"><LoadingSpinner size="40px" /></div> : incentives.length === 0 ? (
                    <p className="text-center">No incentives currently available. Please check back later.</p>
                ) : (
                    <div className="incentives-grid">
                        {incentives.map(incentive => (
                            <div key={incentive.id} className="incentive-card card">
                                <div className="incentive-icon">🎁</div> 
                                <h4>{incentive.name}</h4>
                                <p className="incentive-description">{incentive.description}</p>
                                <div className="incentive-cost">{incentive.cost} HOPE</div>
                                <Button
                                    onClick={() => handleRedeem(incentive)}
                                    disabled={redeeming === incentive.id || parseFloat(balance) < incentive.cost || !user?.ethAddress}
                                    className="btn-primary"
                                >
                                    {redeeming === incentive.id ? <LoadingSpinner size="20px" color="#fff" /> : 'Redeem'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RedemptionPage;