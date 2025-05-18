import React, { useState } from 'react';
import PageTitle from '../components/Common/PageTitle';
import InputField from '../components/Form/InputField';
import Button from '../components/Common/Button';
import { useAuth } from '../hooks/useAuth'; // To prefill if logged in
// import { registerAsDonor } from '../services/donorService'; // Placeholder for API call
import './BecomeDonorPage.css'; // Make sure this CSS file exists

const BecomeDonorPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    dob: '', // Date of Birth
    bloodGroup: '',
    organsToDonate: [], // For multiple checkbox selection if needed, or textarea
    additionalInfo: '',
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});


  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]; // Example

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) { // Clear error on change
        setFormErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required.";
    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid.";
    if (!formData.phone.trim()) errors.phone = "Phone number is required.";
    // else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) errors.phone = "Phone number is invalid."; // Example E.164
    if (!formData.consent) errors.consent = "You must consent to register.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        setSubmitMessage('Please correct the errors in the form.');
        return;
    }
    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      // await registerAsDonor(formData); // Actual API call
      console.log('Donor Registration Data:', formData);
      setSubmitMessage({ type: 'success', text: 'Thank you for registering! We will contact you shortly with next steps.'});
      setFormData({ fullName: '', email: '', phone: '', address: '', dob: '', bloodGroup: '', additionalInfo: '', consent: false }); // Reset form
      setFormErrors({});
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Registration failed. Please try again. ' + (error.response?.data?.message || error.message || '') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="become-donor-page">
      <PageTitle
        title="Become an Organ Donor"
        subtitle="Your decision to register as an organ donor can save up to 8 lives and enhance the lives of many others."
      />
      <div className="container donor-awareness-banner">
        <p>🟢 Over 500,000 people are waiting for organ transplants in India. Your pledge can make a difference.</p>
      </div>

      <div className="container page-content-grid">
        <div className="donor-info-section">
          <h2>The Gift of Life</h2>
          <p>Registering as an organ donor is a selfless act that offers hope to countless individuals and families. Understand the process and the profound impact you can make.</p>
          
          <div className="info-box did-you-know">
            <h3>💡 Did You Know?</h3>
            <ul>
              <li>A single deceased donor can save up to 8 lives through organ donation and heal more than 75 people through tissue donation.</li>
              <li>Living donors can donate a kidney or part of their liver, lungs, or pancreas.</li>
              <li>Donors of all ages and medical histories should consider themselves potential donors.</li>
              <li>There is no cost to the donor's family for organ or tissue donation.</li>
            </ul>
          </div>

          <div className="info-box what-happens">
            <h3>What Happens After Registration?</h3>
            <ol className="steps-list">
              <li><strong>Confirmation:</strong> You'll receive a confirmation of your registration.</li>
              <li><strong>Donor Card:</strong> A digital donor card may be issued. Your decision is stored securely.</li>
              <li><strong>Inform Family:</strong> It's crucial to discuss your decision with your family.</li>
              <li><strong>Activation:</strong> Your donor status is primarily relevant in the event of your death, under specific medical circumstances.</li>
            </ol>
          </div>
        </div>

        <div className="donor-registration-form-section">
          <form onSubmit={handleSubmit} className="form-container" style={{maxWidth: '100%'}} noValidate>
            <h3>Pledge to Donate - Registration Form</h3>
            <InputField
              label="Full Name" type="text" id="fullName" name="fullName"
              value={formData.fullName} onChange={handleChange} placeholder="As per official documents"
              required error={formErrors.fullName}
            />
            <InputField
              label="Email Address" type="email" id="email" name="email"
              value={formData.email} onChange={handleChange} placeholder="your.email@example.com"
              required error={formErrors.email}
            />
            <InputField
              label="Mobile Number" type="tel" id="phone" name="phone"
              value={formData.phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX"
              required error={formErrors.phone}
            />
            <InputField
              label="Date of Birth" type="date" id="dob" name="dob"
              value={formData.dob} onChange={handleChange}
              error={formErrors.dob}
            />
            <div className="form-group">
                <label htmlFor="bloodGroup">Blood Group (Optional)</label>
                <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={formErrors.bloodGroup ? 'input-error' : ''}>
                    <option value="">Select Blood Group</option>
                    {bloodGroupOptions.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                {formErrors.bloodGroup && <small className="form-error-text">{formErrors.bloodGroup}</small>}
            </div>
            <div className="form-group">
              <label htmlFor="address">Address (Optional)</label>
              <textarea
                id="address" name="address" value={formData.address} onChange={handleChange}
                placeholder="Your current residential address" rows="3" error={formErrors.address}
              />
            </div>
            <div className="form-group">
              <label htmlFor="additionalInfo">Organs/Tissues you wish to specify (Optional)</label>
              <textarea
                id="additionalInfo" name="additionalInfo" value={formData.additionalInfo} onChange={handleChange}
                placeholder="e.g., Eyes, Kidneys, Heart, All Organs, etc." rows="3"
              />
            </div>
            <div className="form-checkbox-group">
              <input
                type="checkbox" id="consent" name="consent"
                checked={formData.consent} onChange={handleChange} required
              />
              <label htmlFor="consent" style={formErrors.consent ? {color: 'red'} : {}}>
                I solemnly pledge to donate my organs/tissues as specified and consent to HopeConnect storing my information. I have informed my family about my decision.
              </label>
            </div>
            {formErrors.consent && <small className="form-error-text" style={{marginLeft: '25px'}}>{formErrors.consent}</small>}

            {submitMessage && <p className={`submit-message ${submitMessage.type === 'error' ? 'error' : 'success'}`}>{submitMessage.text}</p>}
            
            <Button type="submit" className="btn-primary btn-lg" disabled={isSubmitting} style={{width: '100%', marginTop: '20px'}}>
              {isSubmitting ? 'Registering Pledge...' : 'Submit My Pledge'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeDonorPage;