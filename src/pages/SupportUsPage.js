import React, { useState } from 'react';
import PageTitle from '../components/Common/PageTitle';
import InputField from '../components/Form/InputField';
import SelectField from '../components/Form/SelectField';
import Button from '../components/Common/Button';
// import { makeDonation } from '../services/donationService'; // Placeholder for API call
import './SupportUsPage.css'; // Make sure this CSS file exists

const SupportUsPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    donationType: 'general',
    amount: '',
    isMonthly: false,
    isAnonymous: false,
    panNumber: '', // For tax receipt
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const donationTypeOptions = [
    { value: 'general', label: 'General Support Fund (Most Needed)' },
    { value: 'technology', label: 'Technology & Innovation Fund' },
    { value: 'awareness', label: 'Awareness & Education Programs' },
    { value: 'patient-support', label: 'Patient & Family Support Fund' },
  ];

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

  const handleAmountPreset = (presetAmount) => {
    setFormData(prev => ({ ...prev, amount: presetAmount.toString() }));
    if (formErrors.amount) {
        setFormErrors(prev => ({...prev, amount: ''}));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.isAnonymous) {
        if (!formData.fullName.trim()) errors.fullName = "Full name is required for non-anonymous donations.";
        if (!formData.email.trim()) errors.email = "Email is required for non-anonymous donations.";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid.";
    }
    if (!formData.amount.trim() || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
        errors.amount = "Please enter a valid donation amount.";
    } else if (parseFloat(formData.amount) < 100) { // Example minimum donation
        errors.amount = "Minimum donation amount is ₹100.";
    }
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
        errors.panNumber = "Invalid PAN number format.";
    }

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
      // await makeDonation(formData); // Actual API call
      console.log('Donation Data:', formData);
      // Simulate payment gateway interaction or direct submission
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      setSubmitMessage({type: 'success', text: 'Thank you for your generous support! Your contribution makes a real difference. A confirmation email has been sent.'});
      setFormData({ fullName: '', email: '', phone: '', donationType: 'general', amount: '', isMonthly: false, isAnonymous: false, panNumber: ''});
      setFormErrors({});
    } catch (error) {
      setSubmitMessage({type: 'error', text: 'Donation failed. Please try again. ' + (error.response?.data?.message || error.message || '')});
    } finally {
      setIsSubmitting(false);
    }
  };

  const impactStats = [
    { value: '500+', label: 'Transplants Facilitated' },
    { value: '50+', label: 'Partner Hospitals' },
    { value: '5,000+', label: 'Registered Donors' },
    { value: '95%', label: 'Funds to Programs' }, // Example of fund utilization
  ];

  const donationUseBreakdown = [
    { label: 'Tech & Platform Development', percentage: 45, color: '#007bff' },
    { label: 'Awareness & Education', percentage: 25, color: '#17a2b8' },
    { label: 'Hospital & Staff Training', percentage: 15, color: '#28a745' },
    { label: 'Patient Support Programs', percentage: 10, color: '#ffc107' },
    { label: 'Admin & Operations', percentage: 5, color: '#6c757d' },
  ];


  return (
    <div className="support-us-page">
      <div className="support-hero-section">
        <div className="container">
            <span className="hero-icon">❤️</span>
            <h1>Support Our Mission, Give Hope</h1>
            <p>Your contribution fuels our efforts to bridge the organ donation gap in India, giving a new lease on life to thousands waiting for life-saving transplants.</p>
            <div className="hero-actions">
                <Button onClick={() => document.getElementById('donationFormStart')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary btn-lg">
                    Donate Now
                </Button>
                <Button onClick={() => document.getElementById('impactSection')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary btn-lg">
                    See Your Impact
                </Button>
            </div>
        </div>
      </div>

      <section id="impactSection" className="section container">
        <h2 className="section-title">How Your Support Makes a Difference</h2>
        <p className="section-subtitle">
          Every donation, big or small, helps us expand our network, enhance our life-saving technology, 
          and ultimately, save more lives through efficient and equitable organ matching and transplantation.
        </p>
        <div className="impact-showcase">
            <div className="our-impact-stats card">
                <h3>Our Collective Impact (Simulated)</h3>
                <div className="impact-grid">
                {impactStats.map(stat => (
                    <div key={stat.label} className="impact-item">
                    <div className="item-value">{stat.value}</div>
                    <div className="item-label">{stat.label}</div>
                    </div>
                ))}
                </div>
            </div>

            <div className="donation-use card">
                <h3>Where Your Donation Goes</h3>
                {donationUseBreakdown.map(item => (
                <div key={item.label} className="use-item">
                    <div className="use-label-percentage">
                        <span>{item.label}</span>
                        <span>{item.percentage}%</span>
                    </div>
                    <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} title={`${item.percentage}%`}></div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      </section>

      <section id="donationFormStart" className="section donation-form-section">
        <div className="container">
            <div className="donation-form-container">
            <form onSubmit={handleSubmit} className="form-container" style={{maxWidth: '100%'}} noValidate>
                <h3>Make a Secure Donation</h3>
                <p className="form-intro-text">Your generosity is invaluable. Please fill in the details below. All donations are eligible for tax benefits under Section 80G of the Income Tax Act (where applicable).</p>
                
                <div className="form-checkbox-group" style={{marginBottom: '20px', justifyContent: 'flex-start'}}>
                    <input type="checkbox" id="isAnonymous" name="isAnonymous" checked={formData.isAnonymous} onChange={handleChange} />
                    <label htmlFor="isAnonymous">I'd like to make this donation anonymously</label>
                </div>

                {!formData.isAnonymous && (
                <>
                    <InputField
                    label="Full Name (as per PAN for receipt)" type="text" id="fullName" name="fullName"
                    value={formData.fullName} onChange={handleChange} placeholder="Your full name"
                    required={!formData.isAnonymous} error={formErrors.fullName}
                    />
                    <InputField
                    label="Email Address (for receipt)" type="email" id="email" name="email"
                    value={formData.email} onChange={handleChange} placeholder="your.email@example.com"
                    required={!formData.isAnonymous} error={formErrors.email}
                    />
                    <InputField
                    label="Mobile Number (Optional)" type="tel" id="phone" name="phone"
                    value={formData.phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX"
                    error={formErrors.phone}
                    />
                    <InputField
                        label="PAN Number (For 80G receipt, optional)" type="text" id="panNumber" name="panNumber"
                        value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F"
                        error={formErrors.panNumber} style={{textTransform: 'uppercase'}}
                    />
                </>
                )}
                <SelectField
                label="I'd like my donation to support:" id="donationType" name="donationType"
                value={formData.donationType} onChange={handleChange} options={donationTypeOptions}
                required error={formErrors.donationType}
                />
                 <div className="form-group">
                    <label htmlFor="amount">Donation Amount (INR)</label>
                    <div className="amount-presets">
                        {[500, 1000, 2500, 5000, 10000].map(val => (
                            <Button key={val} type="button" className={`btn-outline ${formData.amount === val.toString() ? 'active' : ''}`} onClick={() => handleAmountPreset(val)}>
                                ₹{val.toLocaleString('en-IN')}
                            </Button>
                        ))}
                    </div>
                    <InputField
                        type="number" id="amount" name="amount"
                        value={formData.amount} onChange={handleChange} placeholder="Enter custom amount (e.g., 100)"
                        required error={formErrors.amount}
                    />
                </div>

                <div className="form-checkbox-group" style={{marginTop: '0', marginBottom: '20px'}}>
                    <input type="checkbox" id="isMonthly" name="isMonthly" checked={formData.isMonthly} onChange={handleChange} />
                    <label htmlFor="isMonthly">Make this a recurring monthly donation</label>
                </div>

                {submitMessage && <p className={`submit-message ${submitMessage.type === 'error' ? 'error' : 'success'}`}>{submitMessage.text}</p>}
                
                <Button type="submit" className="btn-primary btn-lg" disabled={isSubmitting} style={{width: '100%', marginTop: '10px'}}>
                {isSubmitting ? 'Processing Donation...' : `Donate Securely ${formData.amount ? `₹${parseFloat(formData.amount).toLocaleString('en-IN')}` : ''}`}
                </Button>
                <p className="secure-donation-text">🔒 Your donation is processed securely. Payment gateway will open next.</p>
                <p className="tax-info-text">All Indian donations are eligible for tax exemption under Section 80G.</p>
            </form>
            </div>
        </div>
      </section>
    </div>
  );
};

export default SupportUsPage;