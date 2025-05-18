import React, { useState } from 'react';
import './AuditTrailItem.css'; // Make sure this CSS file exists

const AuditTrailItem = ({ stepNumber, title, timestamp, actor, details, isLast, isExpandedDefault = false, status = 'completed' }) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);

  const getStatusIcon = () => {
    // Could expand this for different statuses (e.g., pending, error)
    if (status === 'completed') return '✔'; 
    if (status === 'pending') return '⏳';
    if (status === 'error') return '❗';
    return stepNumber; // Fallback to step number
  };

  return (
    <div className={`audit-trail-item ${isLast ? 'last-item' : ''} status-${status}`}>
      <div className="audit-trail-marker">
        <div className="marker-circle">
            <span className="status-icon">{getStatusIcon()}</span>
        </div>
        {!isLast && <div className="marker-line"></div>}
      </div>
      <div className="audit-trail-content-wrapper">
        <div className="audit-trail-header" onClick={() => details && setIsExpanded(!isExpanded)} role="button" tabIndex={details ? 0 : -1} onKeyDown={(e) => details && (e.key === 'Enter' || e.key === ' ') && setIsExpanded(!isExpanded)}>
          <div>
            <h4 className="audit-title">{title}</h4>
            <p className="audit-meta">{timestamp} • By: {actor}</p>
          </div>
          {details && (
            <button className="expand-button" aria-expanded={isExpanded}>
              {isExpanded ? '− Collapse' : '+ Expand'}
            </button>
          )}
        </div>
        {details && isExpanded && (
          <div className="audit-details">
            {typeof details === 'string' ? <p>{details}</p> : details}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailItem;