import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import PageTitle from '../components/Common/PageTitle';
import StatCard from '../components/Dashboard/StatCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
// import { getDonorProfile, getDonorImpact } from '../services/donorService';
import './DonorProfilePage.css'; // Make sure this CSS file exists
import { Link, Navigate } from 'react-router-dom';
import Button from '../components/Common/Button'; // For edit button

// Mock Data
const mockProfile = {
  fullName: "Aanya Sharma", // Changed from name to fullName
  email: "aanya.s@example.com",
  donorId: "DONOR123",
  dateRegistered: "2024-01-15T10:00:00Z",
  organsPledged: ["Heart", "Lungs", "Liver", "Kidneys", "Corneas"], // From pledge form
  contactNumber: "+91 9876543210",
  address: "123 Hope Street, New Delhi, Delhi 110001",
  bloodGroup: "O+",
  dob: "1985-07-22T00:00:00Z",
};
const mockImpact = {
  livesSavedDirectly: 2, // Organs transplanted
  livesEnhancedThroughTissues: 5, // Tissues used
  healthCredits: 1250, 
  thankYouMessages: [ // Anonymized messages
    { from: "Heart Recipient's Family", message: "Words cannot express our gratitude. Your loved one's gift has given my husband a new life. We will cherish this gift forever.", date: "2025-06-01T14:30:00Z" },
    { from: "Lung Recipient", message: "Because of your selfless act, I can breathe freely and look forward to a future I didn't think was possible. Thank you.", date: "2025-07-10T09:00:00Z" }
  ],
  donationStatusLink: `/track-donation/DONOR123` // Link to public tracking page for this donor
};

const DonorProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === 'donor') { // Ensure user is a donor
        setLoadingData(true);
        try {
          // const profileData = await getDonorProfile(user.id); // Assuming user.id is the system ID
          // const impactData = await getDonorImpact(user.donorId || profileData.donorId); // Use donorId from profile or user context
          
          // Using mock data, assuming user.email or some ID maps to this
          // In a real app, you'd fetch based on user.id or a specific donor_system_id
          if (user.email === mockProfile.email) { // Simple mock mapping
            setProfile(mockProfile); 
            setImpact(mockImpact);
          } else {
            // If no match, could set to a default "no profile data" state or error
             setProfile(null); setImpact(null);
             console.warn("Mock profile not found for current user.");
          }
        } catch (error) {
          console.error("Failed to load donor data:", error);
           setProfile(null); setImpact(null); // Clear on error
        } finally {
          setLoadingData(false);
        }
      } else if (!authLoading && !user) { // User not logged in
        setLoadingData(false);
      } else if (!authLoading && user && user.role !== 'donor') { // Logged in but not a donor
        setLoadingData(false);
      }
    };

    if (!authLoading) { // Only fetch data once auth status is resolved
        fetchData();
    }
  }, [user, authLoading]);

  if (authLoading || loadingData) {
    return <div className="container text-center mt-3" style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><LoadingSpinner size="60px" /></div>;
  }

  if (!user) { // Redirect if not logged in
    return <Navigate to="/login" state={{ from: '/dashboard/profile' }} replace />;
  }
  if (user.role !== 'donor') { // Redirect if not a donor
     return <Navigate to="/unauthorized" state={{ from: '/dashboard/profile' }} replace />;
  }
  if (!profile) {
    return <PageTitle title="Donor Profile" subtitle="Your profile information could not be loaded or is not yet available." />;
  }


  return (
    <div className="donor-profile-page">
      <PageTitle title={`Welcome, ${profile.fullName}`} subtitle={`Donor ID: ${profile.donorId} | Registered Donor`} />
      
      <div className="container profile-content-grid">
        {/* Left Column: Profile Details & Incentives */}
        <div className="profile-left-column">
            <section className="profile-details-section card">
                <h3>Your Pledge Information</h3>
                <div className="details-grid">
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Contact:</strong> {profile.contactNumber || 'N/A'}</p>
                    <p><strong>Date of Birth:</strong> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Blood Group:</strong> {profile.bloodGroup || 'N/A'}</p>
                    <p><strong>Pledged Organs:</strong> {profile.organsPledged.join(', ') || 'All eligible organs'}</p>
                    <p><strong>Address:</strong> {profile.address || 'N/A'}</p>
                    <p><strong>Registered On:</strong> {new Date(profile.dateRegistered).toLocaleDateString()}</p>
                </div>
                <div className="text-right mt-2"> {/* Use text-right if you have such a utility class */}
                    <Button className="btn-outline btn-sm" onClick={() => alert('Edit Profile functionality to be implemented.')}>
                        Edit Profile
                    </Button>
                </div>
            </section>

            <section className="incentives-section card">
                <h3>Donor Family Benefits & Support</h3>
                <p>HopeConnect and its partners are committed to recognizing the gift of donation. Families of donors may be eligible for:</p>
                <ul>
                    <li>Priority consideration for family members on transplant waiting lists (as per prevailing NOTTO/SOTTO guidelines).</li>
                    <li>Bereavement support and counseling services.</li>
                    <li>Commemorative honors and inclusion in donor recognition programs.</li>
                    <li>Potential assistance with certain medical or funeral expenses (case-specific, policy-dependent).</li>
                </ul>
                <p><Link to="/about#donor-support">Learn more about our donor support initiatives.</Link></p>
            </section>
        </div>

        {/* Right Column: Impact Stats & Messages */}
        <div className="profile-right-column">
            {impact && (
                <>
                <section className="impact-overview-section">
                    <h3>Your Life-Saving Impact</h3>
                    <div className="stats-grid">
                        <StatCard title="Lives Directly Saved" value={impact.livesSavedDirectly} icon="❤️" color="#28a745"/>
                        <StatCard title="Lives Enhanced (Tissues)" value={impact.livesEnhancedThroughTissues} icon="✨" color="#17a2b8"/>
                        <StatCard title="Health Credits (Ex.)" value={impact.healthCredits.toLocaleString()} icon="🏆" color="#ffc107"/>
                    </div>
                    <div className="text-center mt-3">
                        <Link to={impact.donationStatusLink || `/track-donation/${profile.donorId}`} className="btn btn-primary">
                            View Detailed Donation Status
                        </Link>
                    </div>
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
            )}
             {!impact && <p className="card">Impact data is currently being updated. Please check back soon.</p>}
        </div>
      </div>
    </div>
  );
};

export default DonorProfilePage;