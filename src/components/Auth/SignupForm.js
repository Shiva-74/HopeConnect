import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { registerUser } from '../../services/authService'; // Uncomment when service is ready
import InputField from '../Form/InputField';
import SelectField from '../Form/SelectField';
import Button from '../Common/Button';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor', // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) { // Basic password length validation
        setError('Password should be at least 6 characters long.');
        return;
    }
    setError('');
    setLoading(true);
    try {
      // const { confirmPassword, ...signupData } = formData;
      // await registerUser(signupData); // API Call
      console.log('Simulating signup:', formData);
      alert('Signup successful! Please login.'); // Placeholder
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'donor', label: 'I am a Donor / Family Member' },
    { value: 'hospital_staff', label: 'I am a Hospital Staff' },
    // Admin/Regulator roles typically aren't part of public signup flows
  ];

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 style={{textAlign: 'center', color: '#0056b3', marginBottom: '25px'}}>Create Your HopeConnect Account</h2>
      {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
      <InputField
        label="Full Name"
        type="text"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Your full name"
        required
      />
      <InputField
        label="Email Address"
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="you@example.com"
        required
      />
      <InputField
        label="Password"
        type="password"
        id="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Choose a strong password (min. 6 characters)"
        required
      />
      <InputField
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Re-enter your password"
        required
      />
      <SelectField
        label="I am signing up as a:"
        id="role"
        name="role"
        value={formData.role}
        onChange={handleChange}
        options={roleOptions}
        required
      />
      <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '12px' }} disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </Button>
      <p className="mt-3 text-center" style={{fontSize: '0.9rem'}}>
        Already have an account? <Link to="/login" style={{ color: '#007bff', fontWeight: '500' }}>Login Here</Link>
      </p>
    </form>
  );
};

export default SignupForm;