import React from 'react';

const StatCard = ({ icon, title, value, change, changeType }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-info">
        <p className="stat-card-title">{title}</p>
        <h3 className="stat-card-value">{value}</h3>
        <p className={`stat-card-change ${changeType === 'increase' ? 'positive' : 'negative'}`}>
          {change} from last month
        </p>
      </div>
    </div>
  );
};

export default StatCard;