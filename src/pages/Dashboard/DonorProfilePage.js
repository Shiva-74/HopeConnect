import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PageTitle from '../../components/Common/PageTitle';
import StatCard from '../../components/Dashboard/StatCard';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { getDonorProfile, getDonorImpact } from '../../services/donorService'; // Assuming these are implemented
import { getTokenBalanceForUser } from '../../services/tokenService';
import './DonorProfilePage.css'; 
import { Link, Navigate } from 'react-router-dom';
import Button from '../../components/Common/Button'; 

// Mock Data (keep for dev if services not fully ready)
const mockProfile = {
  fullName: "Aanya Sharma",
  email: "aanya.s@example.com", // Ensure this matches a simulated logged-in user for mock to work
  donorId: "DONOR123", // This should be the DID from the backend
  dateRegistered: "2024-01-15T10:00:00Z",
  pledgedOrgans: ["Heart", "Lungs", "Liver", "Kidneys", "Corneas"],
  contactNumber: "+91 9876543210",
  address: "123 Hope Street, New Delhi, Delhi 110001",
  bloodGroup: "O+",
  dob: "1985-07-22T00:00:00Z",
  healthCheckStatus: "Fit for Donation",
};
const mockImpact = {
  livesSavedDirectly: 2,
  livesEnhancedThroughTissues: 5,
  healthCredits: 1250, 
  thankYouMessages: [
    { from: "Heart Recipient's Family", message: "Words cannot express our gratitude. Your loved one's gift has given my husband a new life. We will cherish this gift forever.", date: "2025-06-01T14:30:00Z" },
    { from: "Lung Recipient", message: "Because of your selfless act, I can breathe freely and look forward to a future I didn't think was possible. Thank you.", date: "2025-07-10T09:00:00Z" }
  ],
  donationStatusLink: `/track-donation/DONOR123`
};

const DonorProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [impact, setImpact] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [loadingData, setLoadingData] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === 'donor') {
        setLoadingData(true);
        setLoadingBalance(true);

        try {
          // Replace with actual API calls when ready
          // const profileData = await getDonorProfile(user.donorProfileId || user.id); 
          // const impactData = await getDonorImpact(profileData.did || profileData.donorId); 
          
          // Using mock data
          if (user.email === mockProfile.email) { 
            setProfile({ ...mockProfile, donorId: mockProfile.did || mockProfile.donorId }); // Ensure donorId is consistent
            setImpact(mockImpact);
          } else {
             // Attempt to fetch if user has a donorProfileId from login
            if(user.donorProfileId) {
                 // const profileData = await getDonorProfile(user.donorProfileId);
                 // setProfile(profileData);
                 // const impactData = await getDonorImpact(profileData.did);
                 // setImpact(impactData);
                 // For now, if no direct mock match, show placeholder/error
                 console.warn("No direct mock profile match for user, and API calls are mocked. DonorProfileId:", user.donorProfileId);
                 setProfile({fullName: user.name, email: user.email, donorId: "N/A (Profile Pending)", organsPledged: []}); // Basic info
                 setImpact({ livesSavedDirectly: 0, livesEnhancedThroughTissues: 0, healthCredits: 0, thankYouMessages: [] });
            } else {
                 setProfile(null); setImpact(null);
                 console.warn("Mock profile not found and no donorProfileId for current user.");
            }
          }
        } catch (error) {
          console.error("Failed to load donor profile/impact data:", error);
          setProfile(null); setImpact(null);
        } finally {
          setLoadingData(false);
        }

        if (user.ethAddress) {
          try {
            const balanceData = await getTokenBalanceForUser();
            setTokenBalance(balanceData.balance);
          } catch (error) {
            console.error("Failed to fetch token balance:", error);
          } finally {
            setLoadingBalance(false);
          }
        } else {
            setLoadingBalance(false);
        }
      } else if (!authLoading) {
        setLoadingData(false);
        setLoadingBalance(false);
      }
    };

    if (!authLoading) {
        fetchData();
    }
  }, [user, authLoading]);

  if (authLoading || loadingData) {
    return <div className="container text-center mt-5 pt-5" style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><LoadingSpinner size="60px" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/dashboard/profile' }} replace />;
  }
  if (user.role !== 'donor') {
     return <Navigate to="/unauthorized" state={{ from: '/dashboard/profile' }} replace />;
  }
  if (!profile) {
    return (
        <div className="container text-center mt-5 pt-5">
            <PageTitle title="Donor Profile" subtitle="Your donor profile is not yet created or could not be loaded." />
            <p>Please complete your donor registration to view your profile and impact.</p>
            <Link to="/become-a-donor">
                <Button className="btn-primary">Register as a Donor</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="donor-profile-page">
      <PageTitle 
        title={`${profile.fullName || 'Donor Profile'}`} 
        subtitle={`Donor ID (DID): ${profile.donorId || 'N/A'} | Health Status: ${profile.healthCheckStatus || 'N/A'}`} 
      />
      
      <div className="container profile-content-grid">
        <div className="profile-left-column">
            <section className="profile-details-section card">
                <h3>Your Pledge Information</h3>
                <div className="details-grid">
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Contact:</strong> {profile.contactNumber || 'N/A'}</p>
                    <p><strong>Date of Birth:</strong> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Blood Group:</strong> {profile.bloodGroup || 'N/A'}</p>
                    <p><strong>Pledged Organs:</strong> {profile.organsPledged && profile.organsPledged.length > 0 ? profile.organsPledged.join(', ') : 'All eligible organs/tissues'}</p>
                    <p><strong>Address:</strong> {profile.address || 'N/A'}</p>
                    {profile.dateRegistered && <p><strong>Registered On:</strong> {new Date(profile.dateRegistered).toLocaleDateString()}</p>}
                </div>
                <div className="text-right mt-3">
                    <Button className="btn-outline btn-sm" onClick={() => alert('Edit Profile functionality to be implemented.')}>
                        Edit My Profile
                    </Button>
                </div>
            </section>

            <section className="token-incentives-link card">
                <h3>Your HopeTokens & Incentives</h3>
                {user.ethAddress ? (
                    <>
                        <p>
                            You currently have <strong>{loadingBalance ? <LoadingSpinner size="18px" thickness="2px" /> : `${parseFloat(tokenBalance).toLocaleString()} HOPE` }</strong> tokens.
                        </p>
                        <p>These tokens can be redeemed for various benefits and to support the cause further.</p>
                        <Link to="/dashboard/redeem-tokens">
                            <Button className="btn-primary">Redeem Tokens & View Incentives</Button>
                        </Link>
                    </>
                ) : (
                    <p>Please <Link to="/dashboard/profile-edit">update your profile</Link> with your Ethereum address to view and redeem HopeTokens.</p>
                )}
            </section>
        </div>

        <div className="profile-right-column">
            {impact ? (
                <>
                <section className="impact-overview-section card">
                    <h3>Your Life-Saving Impact</h3>
                    <div className="stats-grid">
                        <StatCard title="Lives Directly Saved" value={impact.livesSavedDirectly} icon="❤️" color="#28a745"/>
                        <StatCard title="Lives Enhanced (Tissues)" value={impact.livesEnhancedThroughTissues} icon="✨" color="#17a2b8"/>
                        {/* <StatCard title="Health Credits (Ex.)" value={impact.healthCredits.toLocaleString()} icon="🏆" color="#ffc107"/> */}
                    </div>
                    {profile.donorId && profile.donorId !== "N/A (Profile Pending)" && (
                        <div className="text-center mt-3">
                            <Link to={`/track-donation/${profile.donorId}`} className="btn btn-primary">
                                Track My Donation Journey
                            </Link>
                        </div>
                    )}
                </section>

                {impact.thankYouMessages && impact.thankYouMessages.length > 0 && (
                <section className="thank-you-messages-section card">
                    <h3>Messages of Gratitude (Anonymized)</h3>
                    <div className="messages-list">
                    {impact.thankYouMessages.map((msg, index) => (
                        <div key={index} className="message-item">
                        <p className="message-text">"{msg.message}"</p>
                        <p className="message-meta">- {msg.from} (Received: {new Date(msg.date).toLocaleDateString()})</p>
                        </div>
                    ))}
                    </div>
                </section>
                )}
                </>
            ) : <div className="card p-3 text-center">Impact data is currently being updated.</div>}
        </div>
      </div>
    </div>
  );
};

export default DonorProfilePage;