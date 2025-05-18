import React from 'react';
import './LoadingSpinner.css'; // Make sure this CSS file exists

const LoadingSpinner = ({ size = '50px', color = '#007bff', thickness = '4px', className = '' }) => {
  return (
    <div 
      className={`spinner-container ${className}`} 
      style={{ 
        '--spinner-size': size, 
        '--spinner-color': color,
        '--spinner-thickness': thickness
      }}
      role="status"
      aria-live="polite"
    >
      <div className="spinner">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;