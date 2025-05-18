import React from 'react';
import HeroSection from '../components/Home/HeroSection';
import FeatureCard from '../components/Home/FeatureCard';
import { Link } from 'react-router-dom';
import Button from '../components/Common/Button';
import './HomePage.css'; // Make sure this CSS file exists

const HomePage = () => {
  const features = [
    {
      icon: '🧠', // Replace with actual icons (e.g., from react-icons)
      title: 'AI-Optimized Matching',
      description: 'Our advanced AI ensures the best possible match between donors and recipients, considering multiple factors for higher success rates.',
      link: '/about#technology',
      linkText: 'Learn More'
    },
    {
      icon: '🔗',
      title: 'Blockchain Transparency',
      description: 'Experience an immutable and transparent organ donation process. Every step is recorded securely, ensuring trust and accountability.',
      link: '/about#technology',
      linkText: 'Discover How'
    },
    {
      icon: '🗺️',
      title: 'Geospatial Logistics',
      description: 'Efficiently transport organs with our dynamic logistics hub, optimizing routes and reducing cold ischemia time for better outcomes.',
      link: '/about#technology',
      linkText: 'See The Tech'
    },
    {
      icon: '🤝',
      title: 'Stakeholder Portals',
      description: 'Dedicated dashboards for hospitals, NGOs, regulators, and donor families, providing tailored information and real-time updates.',
      link: '/login', // Link to login to see portals
      linkText: 'Access Portals'
    }
  ];

  // Simplified impact stats for display
  const impactStats = [
    { value: '500+', label: 'Transplants Facilitated (Simulated)' },
    { value: '50+', label: 'Partner Hospitals (Simulated)' },
    { value: '5,000+', label: 'Registered Donors (Simulated)' },
    { value: '15+', label: 'States Covered (Simulated)' },
  ];

  return (
    <div className="homepage">
      <HeroSection />

      <section className="section features-section">
        <div className="container">
          <h2 className="section-title">Why HopeConnect?</h2>
          <p className="section-subtitle">
            We are leveraging cutting-edge technology to address critical challenges in organ donation,
            making the process faster, fairer, and more transparent for everyone involved.
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                link={feature.link}
                linkText={feature.linkText}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section impact-section">
        <div className="container">
          <h2 className="section-title">Our Impact So Far</h2>
          <div className="impact-stats-grid">
            {impactStats.map(stat => (
              <div key={stat.label} className="impact-stat-item card">
                <div className="impact-value">{stat.value}</div>
                <div className="impact-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container text-center">
          <h2 className="section-title">Ready to Make a Difference?</h2>
          <p className="section-subtitle" style={{maxWidth: '600px', margin: '0 auto 30px auto'}}>
            Whether you want to register as a donor, partner with us, or support our mission, 
            your contribution can save lives.
          </p>
          <div className="cta-buttons">
            <Link to="/become-a-donor"><Button className="btn-primary btn-lg">Become a Donor</Button></Link>
            <Link to="/support-us"><Button className="btn-secondary btn-lg">Support Us</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;