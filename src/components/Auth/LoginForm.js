import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../Form/InputField';
import Button from '../Common/Button';
// import { loginUser } from '../../services/authService'; // Uncomment when service is ready

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // const response = await loginUser({ email, password }); // API Call
      // const userData = response.user;
      // const token = response.token;
      
      // For now, simulate login
      const simulatedUserData = { 
        id: 'user123', 
        email, 
        name: email.split('@')[0] || 'Test User', 
        role: email.includes('hospital') ? 'hospital_staff' : email.includes('admin') ? 'admin' : email.includes('regulator') ? 'regulator' : 'donor' // Simple role sim
      }; 
      const fakeToken = 'fake_jwt_token_string';
      login(simulatedUserData, fakeToken); 
      
      // Navigate based on role or intended destination
      if (from && from !== "/login" && from !== "/signup") {
        navigate(from, { replace: true });
      } else if (simulatedUserData.role === 'hospital_staff') {
        navigate('/hospital-portal', { replace: true });
      } else if (simulatedUserData.role === 'admin' || simulatedUserData.role === 'regulator') {
        navigate('/admin-portal', { replace: true });
      } else {
        navigate('/dashboard', { replace: true }); 
      }

    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 style={{textAlign: 'center', color: '#0056b3', marginBottom: '25px'}}>Login to HopeConnect</h2>
      {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
      <InputField
        label="Email Address"
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <InputField
        label="Password"
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />
      <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '12px' }} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      <p className="mt-3 text-center" style={{fontSize: '0.9rem'}}>
        Don't have an account? <Link to="/signup" style={{ color: '#007bff', fontWeight: '500' }}>Sign Up Here</Link>
      </p>
    </form>
  );
};

export default LoginForm;