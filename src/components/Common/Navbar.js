// Create/open hopeconnect-frontend/src/components/Common/Navbar.js
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom'; // Assuming react-router-dom is now installed
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/images/logo.png'; // This path is correct. Ensure file exists.

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <img src={logo} alt="HopeConnect Logo" onError={(e) => e.target.style.display='none'} />
        HopeConnect
      </Link>
      <ul className="nav-links">
        <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
        <li><NavLink to="/become-a-donor" className={({ isActive }) => isActive ? "active" : ""}>Become a Donor</NavLink></li>
        <li><NavLink to="/hospital-partners" className={({ isActive }) => isActive ? "active" : ""}>Hospital Partners</NavLink></li>
        <li><NavLink to="/support-us" className={({ isActive }) => isActive ? "active" : ""}>Support Us</NavLink></li>
        <li><NavLink to="/track-donation" className={({ isActive }) => isActive ? "active" : ""}>Track Donation</NavLink></li>
        <li><NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>About</NavLink></li>

        {user && (
            <>
                {user.role === 'donor' && (
                    <li><NavLink to="/dashboard/profile" className={({ isActive }) => isActive ? "active" : ""}>My Profile</NavLink></li>
                )}
                {(user.role === 'hospital_staff') && (
                    <li><NavLink to="/hospital-portal" className={({ isActive }) => isActive ? "active" : ""}>Hospital Portal</NavLink></li>
                )}
                {(user.role === 'admin' || user.role === 'regulator') && (
                    <li><NavLink to="/admin-portal" className={({ isActive }) => isActive ? "active" : ""}>Admin/Regulator</NavLink></li>
                )}
            </>
        )}
      </ul>
      <div className="nav-auth-buttons">
        {user ? (
          <>
            <span style={{ marginRight: '15px', alignSelf: 'center', color: '#555' }}>
                Hi, {user.name || user.email.split('@')[0]} ({user.role})
            </span>
            <button onClick={handleLogout} className="btn-login">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-login">Log In</Link>
            <Link to="/signup" className="btn-signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;