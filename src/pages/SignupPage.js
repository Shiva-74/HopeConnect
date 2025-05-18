// Create/open hopeconnect-frontend/src/pages/SignupPage.js
import React from 'react';
import SignupForm from '../components/Auth/SignupForm';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is now installed
import logo from '../assets/images/logo.png'; // This path is correct. Ensure file exists.

const SignupPage = () => {
  return (
    <div className="auth-page-container">
        <div className="auth-form-wrapper">
            <div className="auth-logo-container text-center mb-3">
                <Link to="/">
                    <img src={logo} alt="HopeConnect Logo" style={{height: '50px', marginBottom: '10px'}} onError={(e) => e.target.style.display='none'}/>
                    <h1 style={{fontSize: '1.8rem', color: '#007bff', margin: 0}}>HopeConnect</h1>
                </Link>
            </div>
            <SignupForm />
        </div>
    </div>
  );
};

export default SignupPage;