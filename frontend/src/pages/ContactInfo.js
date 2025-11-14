import React from 'react';

const ContactInfo = () => {
  return (
    <div className="contact-info-container">
      <div className="contact-card">
        <h4>Email Support</h4>
        <p>Get help via email</p>
        <a href="mailto:support@civiceye.com">support@civiceye.com</a>
        <span>7d/7 response within 24 hours</span>
      </div>
      <div className="contact-card">
        <h4>Phone Support</h4>
        <p>Speak with our team</p>
        <span>1-800-CIVICEYE</span>
        <span>Now-Fr, 10am-6pm PST</span>
      </div>
      <div className="contact-card">
        <h4>Live Chat</h4>
        <p>Chat with us in real-time</p>
        <span>Available in-app</span>
         <span>Now-Fr, 10am-6pm PST</span>
      </div>
    </div>
  );
};

export default ContactInfo;
