import React, { useState } from 'react';
import PageTitle from '../components/Common/PageTitle';
import InputField from '../components/Form/InputField';
import SelectField from '../components/Form/SelectField';
import Button from '../components/Common/Button';
// import { registerHospital } from '../services/hospitalService';
import './HospitalPartnersPage.css'; // Make sure this CSS file exists

const HospitalPartnersPage = () => {
  const [formData, setFormData] = useState({
    hospitalName: '',
    contactPerson: '',
    email: '',
    phone: '',
    hospitalType: '',
    hospitalAddress: '',
    city: '',
    state: '',
    pincode: '',
    numberOfBeds: '',
    transplantServicesOffered: '', // Could be checkboxes or textarea
    additionalInfo: '',
    authorize: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const hospitalTypeOptions = [
    { value: 'multi-specialty', label: 'Multi-Specialty Hospital' },
    { value: 'transplant-center', label: 'Specialized Transplant Center' },
    { value: 'government', label: 'Government Hospital' },
    { value: 'private', label: 'Private Hospital' },
    { value: 'trust-charitable', label: 'Trust / Charitable Hospital'},
    { value: 'other', label: 'Other' },
  ];

  // Example states list (can be expanded or fetched)
  const indianStates = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
        setFormErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.hospitalName.trim()) errors.hospitalName = "Hospital name is required.";
    if (!formData.contactPerson.trim()) errors.contactPerson = "Contact person name is required.";
    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid.";
    if (!formData.phone.trim()) errors.phone = "Phone number is required.";
    // Add more specific phone validation if needed
    if (!formData.hospitalType) errors.hospitalType = "Hospital type is required.";
    if (!formData.hospitalAddress.trim()) errors.hospitalAddress = "Hospital address is required.";
    if (!formData.city.trim()) errors.city = "City is required.";
    if (!formData.state) errors.state = "State is required.";
    if (!formData.pincode.trim()) errors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(formData.pincode)) errors.pincode = "Pincode must be 6 digits.";
    if (formData.numberOfBeds && (isNaN(parseInt(formData.numberOfBeds)) || parseInt(formData.numberOfBeds) <= 0)) {
        errors.numberOfBeds = "Number of beds must be a positive number.";
    }

    if (!formData.authorize) errors.authorize = "You must authorize to proceed.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        setSubmitMessage({type: 'error', text: 'Please correct the errors in the form.'});
        return;
    }
    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      // await registerHospital(formData); // Actual API call
      console.log('Hospital Partnership Application Data:', formData);
      setSubmitMessage({type: 'success', text: 'Thank you for your interest! Our team will review your application and get in touch soon.'});
      setFormData({
        hospitalName: '', contactPerson: '', email: '', phone: '', hospitalType: '',
        hospitalAddress: '', city: '', state: '', pincode: '', numberOfBeds: '', 
        transplantServicesOffered: '', additionalInfo: '', authorize: false,
      });
      setFormErrors({});
    } catch (error) {
      setSubmitMessage({type: 'error', text: 'Application failed. Please try again. ' + (error.response?.data?.message || error.message || '')});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hospital-partners-page">
      <PageTitle
        title="Hospital Partnership Program"
        subtitle="Join our network to revolutionize your transplant program with HopeConnect's technology and support."
      />

      <section className="section container benefits-intro">
        <h2 className="section-title">Empowering Hospitals, Saving Lives</h2>
        <p className="section-subtitle" style={{marginBottom: '40px'}}>
            Partnering with HopeConnect provides hospitals access to a suite of tools designed to enhance efficiency,
            improve transplant outcomes, and expand your reach within the national organ sharing network.
        </p>
        <div className="benefits-grid">
            <div className="card benefit-card">
                <span className="benefit-icon">⚙️</span><h3>Advanced Technology</h3>
                <p>Utilize AI matching, blockchain registry, and geospatial hub for transparent operations.</p>
            </div>
            <div className="card benefit-card">
                <span className="benefit-icon">📈</span><h3>Improved Outcomes</h3>
                <p>Increase successful transplant rates and reduce wait times with optimized allocation.</p>
            </div>
            <div className="card benefit-card">
                <span className="benefit-icon">🌐</span><h3>Wider Network</h3>
                <p>Connect to a larger pool of donors and recipients, enhancing matching possibilities.</p>
            </div>
             <div className="card benefit-card">
                <span className="benefit-icon">📊</span><h3>Data & Compliance</h3>
                <p>Access real-time data, fairness analytics, and tools for NOTTO/ROTTO compliance.</p>
            </div>
        </div>
      </section>


      <div className="container page-content-grid-hospital">
        <div className="partner-info-section-hospital">
          <h2>Join the HopeConnect Network</h2>
          <p>Becoming a HopeConnect partner hospital is a step towards transforming organ transplantation in India. Complete the application form, and our partnership team will contact you to discuss the next steps and integration process.</p>
          
          <div className="demo-video-box">
            <h3>See HopeConnect in Action</h3>
            <p>Watch a brief overview of our platform and its benefits for partner hospitals.</p>
            <div className="video-placeholder"><span>▶️ Platform Demo</span></div>
            <Button className="btn-primary" onClick={() => alert('Platform Demo Video Clicked!')} style={{marginTop: '15px'}}>
              Watch Demo Video
            </Button>
          </div>

          <div className="testimonial-box card">
            <h4>From Our Partner Network</h4>
            <blockquote className="testimonial-quote">
              "HopeConnect's AI has significantly improved our matching efficiency, reducing critical decision time. The transparent audit trail also enhances trust with patient families and regulators."
            </blockquote>
            <div className="testimonial-author">
              <span className="author-avatar">RS</span>
              <div><strong>Dr. Riya Sharma</strong><p>Head of Transplant Unit, City General Hospital</p></div>
            </div>
          </div>
        </div>

        <div className="hospital-registration-form-section">
          <form onSubmit={handleSubmit} className="form-container" style={{maxWidth: '100%'}} noValidate>
            <h3>Hospital Partnership Application</h3>
            <InputField
              label="Hospital Name" type="text" id="hospitalName" name="hospitalName"
              value={formData.hospitalName} onChange={handleChange} placeholder="Official name of the hospital"
              required error={formErrors.hospitalName}
            />
            <InputField
              label="Contact Person Name" type="text" id="contactPerson" name="contactPerson"
              value={formData.contactPerson} onChange={handleChange} placeholder="Full name of authorized contact"
              required error={formErrors.contactPerson}
            />
            <div className="form-row">
                <InputField
                label="Contact Email" type="email" id="email" name="email"
                value={formData.email} onChange={handleChange} placeholder="official.contact@hospital.org"
                required error={formErrors.email}
                />
                <InputField
                label="Contact Phone" type="tel" id="phone" name="phone"
                value={formData.phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX"
                required error={formErrors.phone}
                />
            </div>
            <SelectField
              label="Type of Hospital" id="hospitalType" name="hospitalType"
              value={formData.hospitalType} onChange={handleChange} options={hospitalTypeOptions}
              required error={formErrors.hospitalType}
            />
            <InputField
              label="Full Hospital Address" type="text" id="hospitalAddress" name="hospitalAddress"
              value={formData.hospitalAddress} onChange={handleChange} placeholder="Street address, Landmark"
              required error={formErrors.hospitalAddress}
            />
            <div className="form-row">
                <InputField
                    label="City" type="text" id="city" name="city"
                    value={formData.city} onChange={handleChange} placeholder="City name"
                    required error={formErrors.city}
                />
                <SelectField
                    label="State/UT" id="state" name="state"
                    value={formData.state} onChange={handleChange} 
                    options={indianStates.map(s => ({value: s, label: s}))}
                    required error={formErrors.state}
                />
            </div>
             <InputField
                label="Pincode" type="text" id="pincode" name="pincode"
                value={formData.pincode} onChange={handleChange} placeholder="6-digit Pincode"
                required error={formErrors.pincode} maxLength="6"
            />
            <InputField
              label="Approximate Number of Beds" type="number" id="numberOfBeds" name="numberOfBeds"
              value={formData.numberOfBeds} onChange={handleChange} placeholder="e.g., 200"
              error={formErrors.numberOfBeds}
            />
            <div className="form-group">
              <label htmlFor="transplantServicesOffered">Transplant Services Offered (e.g., Kidney, Liver, Heart)</label>
              <textarea
                id="transplantServicesOffered" name="transplantServicesOffered"
                value={formData.transplantServicesOffered} onChange={handleChange}
                placeholder="List the organ transplant services your hospital provides" rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="additionalInfo">Additional Information (Optional)</label>
              <textarea
                id="additionalInfo" name="additionalInfo" value={formData.additionalInfo} onChange={handleChange}
                placeholder="Any other relevant details about your hospital or transplant program" rows="3"
              />
            </div>
            <div className="form-checkbox-group">
              <input
                type="checkbox" id="authorize" name="authorize"
                checked={formData.authorize} onChange={handleChange} required
              />
              <label htmlFor="authorize" style={formErrors.authorize ? {color: 'red'} : {}}>
                I am an authorized representative of the hospital and agree to HopeConnect's terms for partnership application.
              </label>
            </div>
             {formErrors.authorize && <small className="form-error-text" style={{marginLeft: '25px'}}>{formErrors.authorize}</small>}

            {submitMessage && <p className={`submit-message ${submitMessage.type === 'error' ? 'error' : 'success'}`}>{submitMessage.text}</p>}
            
            <Button type="submit" className="btn-primary btn-lg" disabled={isSubmitting} style={{width: '100%', marginTop: '20px'}}>
              {isSubmitting ? 'Submitting Application...' : 'Submit Partnership Application'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalPartnersPage;