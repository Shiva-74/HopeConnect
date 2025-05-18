import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../components/Common/PageTitle';
import InputField from '../../components/Form/InputField';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { searchDonorsForHospital } from '../../services/hospitalService'; // Ensure this path is correct
import './ManageDonorsPage.css'; // Ensure this CSS file exists and is correctly pathed

const ManageDonorsPage = () => {
    const [donors, setDonors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchDonors = useCallback(async (currentSearchTerm) => {
        setLoading(true);
        setError('');
        try {
            // Actual API call
            const data = await searchDonorsForHospital({ searchTerm: currentSearchTerm });
            setDonors(data || []); // Ensure data is an array
        } catch (err) {
            setError('Failed to fetch donor list. ' + (err.response?.data?.message || err.message));
            setDonors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDonors(''); // Initial fetch for all (or recent) donors
    }, [fetchDonors]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchDonors(searchTerm);
    };

    const handleRegisterOrgan = (donorDid) => {
        // Navigate to the form to register an organ for this specific donor
        navigate(`/hospital-portal/register-organ/${donorDid}`);
    };

    const handleUpdateHealth = (donorDbId) => {
        // Navigate to the form to update health details for this specific donor
        // donorDbId is the Mongoose _id of the Donor document
        navigate(`/hospital-portal/update-donor-health/${donorDbId}`);
    };

    return (
        <div className="manage-donors-page">
            <PageTitle title="Manage Donor Profiles" subtitle="Search, view, and manage donor information for hospital operations." />
            
            <form onSubmit={handleSearchSubmit} className="donor-search-form card">
                <InputField
                    type="text"
                    id="donorSearch"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search by Donor DID, Name, ETH Address..."
                    className="flex-grow-1"
                    autoComplete="off"
                />
                <Button type="submit" className="btn-primary" disabled={loading}>
                    {loading && donors.length === 0 ? <LoadingSpinner size="20px" color="#fff"/> : 'Search'}
                </Button>
            </form>

            {error && <p className="error-message card">{error}</p>}

            {loading && donors.length === 0 && <div className="text-center mt-3"><LoadingSpinner size="50px"/></div>}
            
            {!loading && donors.length === 0 && !error && (
                <p className="text-center mt-3 card p-3">No donors found matching your criteria or no donors available for your hospital.</p>
            )}

            {donors.length > 0 && (
                <div className="donor-list-container card">
                    <table className="donor-list-table">
                        <thead>
                            <tr>
                                <th>Donor DID</th>
                                <th>Full Name</th>
                                <th>ETH Address</th>
                                <th>Consent</th>
                                <th>Health Status</th>
                                <th>DOB</th>
                                <th>Blood Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donors.map(donor => (
                                <tr key={donor.did || donor._id}> {/* Prefer DID if always present */}
                                    <td>{donor.did}</td>
                                    <td>{donor.fullName}</td>
                                    <td>{donor.ethAddress || 'N/A'}</td>
                                    <td><span className={`status-badge ${donor.consent === 'Given' ? 'status-success' : 'status-pending'}`}>{donor.consent}</span></td>
                                    <td><span className={`status-badge ${donor.health?.toLowerCase().includes('fit') ? 'status-success' : donor.health?.toLowerCase().includes('pending') ? 'status-warning' : 'status-danger'}`}>{donor.health}</span></td>
                                    <td>{donor.dob ? new Date(donor.dob).toLocaleDateString() : 'N/A'}</td>
                                    <td>{donor.bloodType || 'N/A'}</td>
                                    <td>
                                        <Button className="btn-outline btn-sm mr-2" onClick={() => handleRegisterOrgan(donor.did)}>Register Organ</Button>
                                        <Button className="btn-secondary btn-sm" onClick={() => handleUpdateHealth(donor._id)}>Update Health</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageDonorsPage;