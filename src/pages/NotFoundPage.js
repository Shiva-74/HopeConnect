import React from 'react';
import { Link } from 'react-router-dom';
import PageTitle from '../components/Common/PageTitle';

const NotFoundPage = () => {
  return (
    <div className="not-found-page container text-center" style={{paddingTop: '60px', paddingBottom: '60px', minHeight: 'calc(100vh - 200px)' /* Adjust based on nav/footer */}}>
      <PageTitle title="404 - Page Not Found" />
      <img src="/404-illustration.svg" alt="Page not found illustration" style={{maxWidth: '300px', margin: '20px auto', display: 'block'}} onError={(e) => e.target.style.display='none'}/>
      <p style={{fontSize: '1.2rem', marginBottom: '30px', color: '#555'}}>
        Oops! The page you are looking for does not exist, may have been moved, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">
        Return to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;