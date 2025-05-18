import React from 'react';
import './StatCard.css'; // Make sure this CSS file exists

const StatCard = ({ title, value, icon, description, color = '#007bff', link, onLinkClick }) => {
  const cardContent = (
    <>
      {icon && (
        <div className="stat-card-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
      )}
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">{value}</p>
        {description && <p className="stat-card-description">{description}</p>}
      </div>
    </>
  );

  if (link) {
    return (
      <a href={link} onClick={onLinkClick} className="stat-card-link">
        <div className="stat-card" style={{ borderLeftColor: color }}>
          {cardContent}
        </div>
      </a>
    );
  }

  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      {cardContent}
    </div>
  );
};

export default StatCard;