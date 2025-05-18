import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Make sure this CSS file exists

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content container">
        <div className="footer-section about">
          <h3 className="footer-logo-text"><span>Hope</span>Connect</h3>
          <p>
            Revolutionizing organ donation in India with transparency and efficiency. 
            Connecting hope, saving lives.
          </p>
          <div className="contact">
            <span><i className="fas fa-phone" style={{marginRight: '5px'}}></i>+91-XXX-XXXXXXX</span>
            <span><i className="fas fa-envelope" style={{marginRight: '5px'}}></i>info@hopeconnect.org</span>
          </div>
          {/* Add social media icons here if needed
          <div className="socials">
            <a href="#"><i className="fab fa-facebook"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
          </div>
          */}
        </div>

        <div className="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/become-a-donor">Become a Donor</Link></li>
            <li><Link to="/hospital-partners">Hospital Partners</Link></li>
            <li><Link to="/support-us">Support Our Mission</Link></li>
            <li><Link to="/track-donation">Track Your Donation</Link></li>
            {/* <li><Link to="/faq">FAQ</Link></li> */}
            {/* <li><Link to="/privacy-policy">Privacy Policy</Link></li> */}
            {/* <li><Link to="/terms-of-service">Terms of Service</Link></li> */}
          </ul>
        </div>

        <div className="footer-section contact-form-footer">
          <h3>Stay Updated</h3>
          <p>Subscribe to our newsletter for updates.</p>
          <form action="#" onSubmit={(e) => {e.preventDefault(); alert('Newsletter subscription submitted!'); e.target.reset();}}>
            <input type="email" name="email" className="text-input contact-input" placeholder="Your email address..." required/>
            <button type="submit" className="btn btn-primary btn-sm">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} HopeConnect | All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;