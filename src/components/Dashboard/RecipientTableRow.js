import React from 'react';
import './RecipientTableRow.css'; // Make sure this CSS file exists

const RecipientTableRow = ({ patient, onSelect, isSelected, onViewDetails }) => {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'ready': return 'status-ready';
      case 'preparing': return 'status-preparing';
      case 'in transit': return 'status-in-transit';
      case 'matched': return 'status-matched';
      default: return 'status-default';
    }
  };

  const handleRowClick = () => {
    if (onSelect) {
        onSelect(patient.patientId);
    }
  };

  const handleViewDetailsClick = (e) => {
    e.stopPropagation(); // Prevent row click if button is clicked
    if (onViewDetails) {
        onViewDetails(patient.patientId);
    }
  };

  return (
    <tr 
        className={`recipient-table-row ${isSelected ? 'selected' : ''} ${onSelect ? 'selectable' : ''}`} 
        onClick={handleRowClick}
        tabIndex={onSelect ? 0 : -1}
        onKeyDown={(e) => onSelect && (e.key === 'Enter' || e.key === ' ') && handleRowClick()}
    >
      <td>
        {patient.patientId}
        {patient.isBestMatch && <span className="best-match-badge">AI Best Match</span>}
      </td>
      <td>{patient.bloodType}</td>
      <td>{patient.age}</td>
      <td>{patient.waiting}</td>
      <td>{patient.distance}</td>
      <td>
        <span className={`status-badge ${getStatusClass(patient.status)}`}>
          {patient.status}
        </span>
      </td>
      <td>
        <div className="match-percentage-bar-container" title={`${patient.matchPercent}% Match Score`}>
          <div 
            className="match-percentage-bar" 
            style={{ 
                width: `${patient.matchPercent}%`, 
                backgroundColor: patient.matchPercent > 85 ? '#28a745' : patient.matchPercent > 70 ? '#ffc107' : '#dc3545' 
            }}
          >
            {patient.matchPercent}%
          </div>
        </div>
      </td>
      {onViewDetails && (
        <td>
            <button className="btn btn-secondary btn-sm" onClick={handleViewDetailsClick}>
                Details
            </button>
        </td>
      )}
    </tr>
  );
};

export default RecipientTableRow;