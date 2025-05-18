// Create/open hopeconnect-frontend/src/pages/LoginPage.js
import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is now installed
import logo from '../assets/images/logo.png'; // This path is correct. Ensure file exists.

const LoginPage = () => {
  return (
    <div className="auth-page-container">
        <div className="auth-form-wrapper">
            <div className="auth-logo-container text-center mb-3">
                <Link to="/">
                    <img src={logo} alt="HopeConnect Logo" style={{height: '50px', marginBottom: '10px'}} onError={(e) => e.target.style.display='none'}/>
                    <h1 style={{fontSize: '1.8rem', color: '#007bff', margin: 0}}>HopeConnect</h1>
                </Link>
            </div>
            <LoginForm />
        </div>
    </div>
  );
};

export default LoginPage;