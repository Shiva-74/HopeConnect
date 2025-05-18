import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Common/Button';
// Styles for HeroSection are in App.css or a dedicated HeroSection.css

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <h1>
            Revolutionizing <span>Organ Donation</span> in India
          </h1>
          <p>
            HopeConnect combines AI, blockchain, and geospatial technology to create a transparent, 
            efficient organ donation ecosystem that saves lives.
          </p>
          <div className="hero-buttons">
            <Link to="/become-a-donor">
              <Button className="btn-primary btn-lg">Get Started</Button>
            </Link>
            <Link to="/about">
              <Button className="btn-secondary btn-lg">Learn More</Button>
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <strong>300k+</strong>
              <span>Patients Waiting</span>
            </div>
            <div className="hero-stat-item">
              <strong>~0.5</strong> {/* Updated to reflect common approx figures */}
              <span>Donations per Million</span>
            </div>
            <div className="hero-stat-item">
              <strong>20+</strong>
              <span>Lives Lost Daily (est.)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;