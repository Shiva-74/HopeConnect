import React from 'react';

const PageTitle = ({ title, subtitle }) => {
  return (
    <div className="page-title-header">
      {title && <h1 className="page-title">{title}</h1>}
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
};

export default PageTitle;