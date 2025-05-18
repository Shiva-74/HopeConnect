import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation
import './FeatureCard.css'; // Make sure this CSS file exists

const FeatureCard = ({ icon, title, description, link, linkText, externalLink }) => {
  const content = (
    <>
      {icon && <div className="feature-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{description}</p>
      {link && linkText && !externalLink && (
        <Link to={link} className="feature-link">
          {linkText} →
        </Link>
      )}
      {externalLink && linkText && (
         <a href={externalLink} className="feature-link" target="_blank" rel="noopener noreferrer">
          {linkText} →
        </a>
      )}
    </>
  );

  return (
    <div className="feature-card card">
      {content}
    </div>
  );
};

export default FeatureCard;