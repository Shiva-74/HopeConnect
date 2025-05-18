import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTitle from '../components/Common/PageTitle';
import Button from '../components/Common/Button'; // Import Button for consistency

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-page container text-center" style={{paddingTop: '60px', paddingBottom: '60px', minHeight: 'calc(100vh - 200px)'}}>
      <PageTitle title="403 - Access Denied" subtitle="Restricted Area"/>
      <img src="/unauthorized-illustration.svg" alt="Access denied illustration" style={{maxWidth: '300px', margin: '20px auto', display: 'block'}} onError={(e) => e.target.style.display='none'}/>
      <p style={{fontSize: '1.2rem', marginBottom: '30px', color: '#555'}}>
        We're sorry, but you do not have the necessary permissions to access this page or resource. 
        Please contact support if you believe this is an error.
      </p>
      <div style={{display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap'}}>
        <Button onClick={() => navigate(-1)} className="btn-secondary btn-lg">
            Go Back
        </Button>
        <Link to="/" className="btn btn-primary btn-lg">
            Return to Homepage
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;