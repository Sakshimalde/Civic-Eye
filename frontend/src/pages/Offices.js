import React from 'react';

const Offices = () => {
  return (
    <div className="offices-section">
      <h2>Our Offices</h2>
      <div className="offices-container">
        <div className="office-card">
          <h4>San Francisco <span>Headquarters</span></h4>
          <p>123 Market Street, Suite 400<br/>San Francisco, CA 94105</p>
          <p>+1 (415) 555-0123</p>
          <button>View on Map</button>
        </div>
        <div className="office-card">
          <h4>Austin <span>Operations</span></h4>
          <p>456 Congress Avenue, Floor 12<br/>Austin, TX 78701</p>
          <p>+1 (512) 555-0187</p>
          <button>View on Map</button>
        </div>
        <div className="office-card">
          <h4>Boston <span>Community Hub</span></h4>
          <p>789 Commonwealth Ave, Suite 200<br/>Boston, MA 02215</p>
          <p>+1 (617) 555-0145</p>
          <button>View on Map</button>
        </div>
      </div>
    </div>
  );
};

export default Offices;
