import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTitle from '../../components/Common/PageTitle';
import InputField from '../../components/Form/InputField';
import SelectField from '../../components/Form/SelectField';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { registerOrganForExistingDonor } from '../../services/hospitalService';
import { ORGAN_TYPES } from '../../utils/constants'; // Ensure this is correctly pathed
import './RegisterOrganForm.css'; // Create this if not already present

const RegisterOrganForm = () => {
    const { donorDidParam } = useParams();
    const { user } = useAuth(); // Hospital staff info
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        donorDid: donorDidParam || '',
        organType: '', // String like "Liver", "Kidney"
        recoveryNotes: '',
        // recoveryHospitalDid: '', // Could be pre-filled if user belongs to one hospital
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formErrors, setFormErrors] = useState({});

    // Prepare organ type options for SelectField
    // Assuming ORGAN_TYPES is an object like { HEART: "Heart", LIVER: "Liver", ... }
    const organTypeOptions = Object.values(ORGAN_TYPES).map(type => ({ value: type, label: type }));
    // If ORGAN_TYPES is just an array of strings:
    // const organTypeOptions = ORGAN_TYPES.map(type => ({ value: type, label: type }));


    useEffect(() => {
        if (donorDidParam) {
            setFormData(prev => ({ ...prev, donorDid: donorDidParam }));
        }
        // Pre-fill recoveryHospitalDid if available from logged-in user's context/profile
        // if (user && user.hospitalDid) { // Assuming hospital DID is stored on user
        //     setFormData(prev => ({ ...prev, recoveryHospitalDid: user.hospitalDid }));
        // }
    }, [donorDidParam, user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (formErrors[e.target.name]) setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const validate = () => {
        const errors = {};
        if (!formData.donorDid.trim()) errors.donorDid = "Donor DID is required.";
        if (!formData.organType) errors.organType = "Organ type is required.";
        // if (!formData.recoveryHospitalDid.trim()) errors.recoveryHospitalDid = "Recovery Hospital DID is required.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            setMessage({ text: "Please correct the form errors.", type: "error" });
            return;
        }
        setSubmitting(true);
        setMessage({ text: "", type: "" });
        try {
            const payload = {
                donorDid: formData.donorDid,
                organType: formData.organType, // This is the string value like "Liver"
                recoveryNotes: formData.recoveryNotes,
                // recoveryHospitalDid: formData.recoveryHospitalDid // Or derived by backend
            };
            const response = await registerOrganForExistingDonor(payload);
            setMessage({ 
                text: `${response.message} Blockchain Organ ID: ${response.organChainId}. Tx: ${response.transactionHash || 'N/A'}`, 
                type: 'success' 
            });
            // Optionally clear form or navigate
            setFormData(prev => ({...prev, recoveryNotes: '', organType: ''})); // Keep donorDid if they might register another
        } catch (error) {
            setMessage({ text: error.response?.data?.message || error.message || 'Failed to register organ.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="register-organ-form-page container">
            <PageTitle title="Register Recovered Organ" subtitle="Log an organ recovered from a registered donor onto the OrganChain." />

            {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}

            <form onSubmit={handleSubmit} className="form-container card">
                <InputField
                    label="Donor DID"
                    type="text"
                    id="donorDid"
                    name="donorDid"
                    value={formData.donorDid}
                    onChange={handleChange}
                    placeholder="Enter Donor's Decentralized ID"
                    required
                    error={formErrors.donorDid}
                    // disabled={!!donorDidParam} // Keep editable in case hospital staff types it
                />
                <SelectField
                    label="Organ Type Recovered"
                    id="organType"
                    name="organType"
                    value={formData.organType}
                    onChange={handleChange}
                    options={organTypeOptions}
                    required
                    error={formErrors.organType}
                />
                {/* Input for Recovery Hospital DID (Optional, might be auto-filled or backend derived) */}
                {/* <InputField
                    label="Recovery Hospital DID"
                    type="text"
                    id="recoveryHospitalDid"
                    name="recoveryHospitalDid"
                    value={formData.recoveryHospitalDid}
                    onChange={handleChange}
                    placeholder="DID of the hospital performing recovery"
                    required
                    error={formErrors.recoveryHospitalDid}
                /> */}
                <div className="form-group">
                    <label htmlFor="recoveryNotes">Recovery Notes & Organ Condition (Optional)</label>
                    <textarea
                        id="recoveryNotes"
                        name="recoveryNotes"
                        value={formData.recoveryNotes}
                        onChange={handleChange}
                        placeholder="e.g., Organ condition, recovery specifics, team involved..."
                        rows="4"
                    />
                </div>
                
                <Button type="submit" className="btn-primary btn-lg" disabled={submitting} style={{width: '100%'}}>
                    {submitting ? <LoadingSpinner size="20px" color="#fff"/> : 'Register Organ on Chain'}
                </Button>
            </form>
        </div>
    );
};

export default RegisterOrganForm;