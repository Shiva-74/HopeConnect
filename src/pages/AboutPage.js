import React from 'react';
import PageTitle from '../components/Common/PageTitle';
import './AboutPage.css'; // Make sure this CSS file exists
import { Link } from 'react-router-dom'; // For internal links

const AboutPage = () => {
  const teamMembers = [ // Example team members
    { name: "Dr. Priya Sharma", role: "Founder & CEO", bio: "Visionary leader with 15+ years in healthcare technology.", image: "/path/to/priya.jpg" },
    { name: "Amit Singh", role: "CTO", bio: "Expert in AI and Blockchain, driving HopeConnect's tech innovation.", image: "/path/to/amit.jpg" },
    { name: "Sunita Reddy", role: "Head of Partnerships", bio: "Building strong collaborations with hospitals and NGOs.", image: "/path/to/sunita.jpg" }
  ];

  return (
    <div className="about-page">
      <PageTitle
        title="About HopeConnect"
        subtitle="Pioneering a new era of organ donation in India through technology, transparency, and trust."
      />
      <div className="container">
        <section id="mission-vision" className="content-section card">
          <div className="mission-vision-grid">
            <div>
              <h2>Our Mission</h2>
              <p>
                To create a transparent, efficient, and equitable organ donation and transplantation ecosystem in India. We leverage cutting-edge technology to connect donors, recipients, hospitals, and regulatory bodies, saving more lives and providing hope to countless families.
              </p>
            </div>
            <div>
              <h2>Our Vision</h2>
              <p>
                A future where no one in India dies waiting for an organ transplant due to systemic inefficiencies or lack of access. We envision a nation where every potential organ donation opportunity is maximized through a trusted, streamlined, and compassionate process.
              </p>
            </div>
          </div>
        </section>

        <section id="technology" className="content-section card technology-showcase">
          <h2>Our Core Technology Pillars</h2>
          <p className="section-intro">HopeConnect is built on a foundation of synergistic technologies designed to address the complexities of organ donation:</p>
          <div className="tech-pillars-grid">
            <div className="pillar">
              <span className="pillar-icon">🧠</span>
              <h3>AI-Optimized Matching (OrganMatch AI)</h3>
              <p>Our AI engine analyzes multi-factorial data (genetics, urgency, logistics, risk profiles) to suggest optimal, fair matches, enhancing transplant success rates beyond traditional methods.</p>
            </div>
            <div className="pillar">
              <span className="pillar-icon">🔗</span>
              <h3>Blockchain Registry (OrganChain)</h3>
              <p>Utilizing distributed ledger technology, we provide an immutable, auditable trail for every step – from donor consent to post-transplant follow-up, ensuring unparalleled transparency and trust.</p>
            </div>
            <div className="pillar">
              <span className="pillar-icon">🗺️</span>
              <h3>Geospatial Logistics Hub</h3>
              <p>Integrated with advanced mapping and routing (e.g., Mapbox, OR-Tools), our platform optimizes organ transport, minimizing ischemia time and coordinating green corridors for swift delivery.</p>
            </div>
             <div className="pillar">
              <span className="pillar-icon">🛡️</span>
              <h3>Secure Stakeholder Portals</h3>
              <p>Role-based access provides tailored dashboards for hospitals, NGOs, regulators, and donor families, ensuring data privacy, real-time updates, and actionable insights.</p>
            </div>
          </div>
        </section>
        
        <section id="our-story" className="content-section card">
            <h2>Our Story</h2>
            <p>HopeConnect was born from a deep understanding of the challenges plaguing India's organ donation landscape – from logistical hurdles to a lack of public trust and awareness. Witnessing the profound impact of these issues, our founders were driven to create a solution that not only addresses these problems but also instills hope. [Add more details about founding, motivations, key milestones].</p>
        </section>

        {/* Placeholder for Team Section - can be expanded */}
        {/* <section id="team" className="content-section card">
          <h2>Meet Our Team</h2>
          <p className="section-intro">HopeConnect is driven by a passionate team of technologists, healthcare professionals, and public policy advocates.</p>
          <div className="team-grid">
            {teamMembers.map(member => (
                <div key={member.name} className="team-member-card">
                    <img src={member.image || 'https://via.placeholder.com/150'} alt={member.name} className="team-member-img" />
                    <h4>{member.name}</h4>
                    <p className="team-member-role">{member.role}</p>
                    <p className="team-member-bio">{member.bio}</p>
                </div>
            ))}
          </div>
        </section> */}

        <section id="get-involved" className="content-section card text-center">
          <h2>Get Involved</h2>
          <p>Your support can help us save more lives. Whether you're an individual, a healthcare professional, or an organization, there are many ways to contribute to our mission.</p>
          <div className="get-involved-links">
            <Link to="/become-a-donor" className="btn btn-primary">Become a Donor</Link>
            <Link to="/hospital-partners" className="btn btn-outline">Partner With Us</Link>
            <Link to="/support-us" className="btn btn-secondary">Support Our Mission</Link>
          </div>
        </section>

        <section id="contact" className="content-section card">
          <h2>Contact Us</h2>
          <p>
            Have questions, suggestions, or want to learn more? We'd love to hear from you.
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:info@hopeconnect.org">info@hopeconnect.org</a><br />
            <strong>Phone:</strong> +91-XXX-XXXXXXX (Mon-Fri, 9 AM - 6 PM IST)<br />
            {/* <strong>Address:</strong> [Your Organization's Address Here] */}
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;