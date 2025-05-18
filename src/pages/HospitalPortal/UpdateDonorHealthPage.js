import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTitle from '../../components/Common/PageTitle';
import InputField from '../../components/Form/InputField';
// import SelectField from '../../components/Form/SelectField'; // If using select for healthCheckPassed
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { updateDonorHealthByHospitalStaff } from '../../services/hospitalService';
// Mock function to simulate fetching donor details if backend isn't ready
import { searchDonorsForHospital } from '../../services/hospitalService'; // To fetch donor for prefill
import './UpdateDonorHealthPage.css'; // Ensure this CSS file exists

// Mock function to simulate fetching donor details if backend isn't ready
const fetchDonorDetailsForUpdate = async (donorDbId) => {
    console.log("Fetching details for donorDbId:", donorDbId);
    // In a real app, this would be an API call: 
    // const donorDetails = await getDonorDetailsById(donorDbId); 
    // For now, try to find in a list if you used mock for ManageDonorsPage
    // Or just return a basic structure.
    // This function now uses searchDonorsForHospital for a mock lookup
    try {
        const donors = await searchDonorsForHospital({ donorDbId }); // Assuming your service can search by _id
        if (donors && donors.length > 0 && donors[0]._id === donorDbId) {
            return donors[0]; // Returns { _id, fullName, did, healthCheckStatus, hlaType, comorbidities }
        }
        return null;
    } catch (error) {
        console.error("Mock fetchDonorDetailsForUpdate error:", error);
        return null;
    }
};


const UpdateDonorHealthPage = () => {
    const { donorDbId } = useParams();
    const navigate = useNavigate();

    const [donorInfo, setDonorInfo] = useState(null);
    const [formData, setFormData] = useState({
        healthCheckPassed: true,
        healthScoreAIGiven: '',
        // labResultsSummary: '', // You can add this field if needed
        comorbidities: '', 
        hlaType: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formErrors, setFormErrors] = useState({});
    const [loadingDonor, setLoadingDonor] = useState(true);

    useEffect(() => {
        const loadDonor = async () => {
            if (donorDbId) {
                setLoadingDonor(true);
                try {
                    const data = await fetchDonorDetailsForUpdate(donorDbId); // Using the mock fetcher
                    if (data) {
                        setDonorInfo(data);
                        setFormData(prev => ({
                            ...prev,
                            hlaType: data.hlaType || '', // Pre-fill from fetched donor data if available
                            comorbidities: data.comorbidities ? data.comorbidities.join(', ') : '',
                            healthCheckPassed: data.healthCheckStatus ? data.healthCheckStatus.toLowerCase().includes('fit') : true,
                            healthScoreAIGiven: data.healthScore_AI || ''
                        }));
                    } else {
                        setMessage({text: 'Donor not found. Please check the ID.', type: 'error'});
                    }
                } catch (error) {
                    setMessage({text: 'Failed to load donor details. ' + (error.message || ''), type: 'error'});
                } finally {
                    setLoadingDonor(false);
                }
            } else {
                setLoadingDonor(false);
                setMessage({text: 'No Donor ID provided in URL.', type: 'error'});
                // navigate('/hospital-portal/manage-donors'); // Redirect if no ID
            }
        };
        loadDonor();
    }, [donorDbId, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
         if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errors = {};
        if (formData.healthScoreAIGiven && 
            (isNaN(parseFloat(formData.healthScoreAIGiven)) || 
             parseFloat(formData.healthScoreAIGiven) < 0 || 
             parseFloat(formData.healthScoreAIGiven) > 100)
        ) {
            errors.healthScoreAIGiven = "Health Score must be a number between 0 and 100.";
        }
        // HLA Type validation (example: must be comma-separated, specific format)
        if (formData.hlaType && !/^[A-Za-z0-9,\s]*$/.test(formData.hlaType)) {
            errors.hlaType = "HLA Type contains invalid characters.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!donorInfo) {
            setMessage({text: "Donor information not loaded, cannot submit.", type: "error"});
            return;
        }
        if (!validate()) {
            setMessage({ text: "Please correct the form errors.", type: "error" });
            return;
        }
        setSubmitting(true);
        setMessage({ text: "", type: "" });

        const payload = {
            healthCheckPassed: formData.healthCheckPassed,
            healthScoreAIGiven: formData.healthScoreAIGiven ? parseFloat(formData.healthScoreAIGiven) : undefined,
            // labResultsSummary: formData.labResultsSummary,
            comorbidities: formData.comorbidities.split(',').map(c => c.trim()).filter(c => c), // Array of strings
            hlaType: formData.hlaType.trim(),
            notes: formData.notes.trim(),
        };

        try {
            const response = await updateDonorHealthByHospitalStaff(donorInfo._id, payload); // Use donorInfo._id which is the DB ID
            setMessage({ text: response.message || 'Health details updated successfully!', type: 'success' });
            // Optionally, re-fetch donor info or navigate
            // setTimeout(() => navigate(`/hospital-portal/manage-donors`), 2000);
        } catch (error) {
            setMessage({ text: error.response?.data?.message || error.message || 'Failed to update health details.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loadingDonor) return <div className="container text-center mt-5"><LoadingSpinner size="50px"/></div>;
    if (!donorInfo && !loadingDonor) return <div className="container card text-center p-3 mt-3">{message.text || 'Donor could not be loaded. Please ensure a valid Donor ID is in the URL.'}</div>;


    return (
        <div className="update-donor-health-page container">
            <PageTitle title={`Update Health for ${donorInfo?.fullName || 'Donor'}`} subtitle={`DID: ${donorInfo?.did || 'N/A'}`} />

            {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}

            <form onSubmit={handleSubmit} className="form-container card">
                 <div className="form-checkbox-group" style={{ marginBottom: '20px' }}>
                    <input
                        type="checkbox"
                        id="healthCheckPassed"
                        name="healthCheckPassed"
                        checked={formData.healthCheckPassed}
                        onChange={handleChange}
                    />
                    <label htmlFor="healthCheckPassed">Health Check Passed (Mark as Fit for Donation)</label>
                </div>
                <InputField
                    label="AI Suggested Health Score (0-100)" type="number" id="healthScoreAIGiven" name="healthScoreAIGiven"
                    value={formData.healthScoreAIGiven} onChange={handleChange} placeholder="e.g., 85 (Optional)"
                    error={formErrors.healthScoreAIGiven}
                />
                <InputField
                    label="HLA Type" type="text" id="hlaType" name="hlaType"
                    value={formData.hlaType} onChange={handleChange} placeholder="e.g., A1,A2,B5,B8,DR1,DR2"
                    error={formErrors.hlaType}
                />
                 <div className="form-group">
                    <label htmlFor="comorbidities">Comorbidities (comma-separated)</label>
                    <textarea
                        id="comorbidities" name="comorbidities" value={formData.comorbidities}
                        onChange={handleChange} placeholder="e.g., Hypertension, Diabetes Type 2"
                        rows="3"
                    />
                </div>
                {/* <div className="form-group">
                    <label htmlFor="labResultsSummary">Lab Results Summary (Optional)</label>
                    <textarea
                        id="labResultsSummary" name="labResultsSummary" value={formData.labResultsSummary}
                        onChange={handleChange} placeholder="Brief summary of key lab findings"
                        rows="4"
                    />
                </div> */}
                <div className="form-group">
                    <label htmlFor="notes">Additional Notes / Observations (Optional)</label>
                    <textarea
                        id="notes" name="notes" value={formData.notes}
                        onChange={handleChange} placeholder="Any other relevant notes from the health check-up"
                        rows="3"
                    />
                </div>
                
                <Button type="submit" className="btn-primary btn-lg" disabled={submitting || !donorInfo} style={{width: '100%'}}>
                    {submitting ? <LoadingSpinner size="20px" color="#fff"/> : 'Update Health Information'}
                </Button>
            </form>
        </div>
    );
};

export default UpdateDonorHealthPage;