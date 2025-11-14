import React from 'react';

const ContactForm = () => {
  return (
    <div className="contact-form-card">
      <h3>Send Us a Message</h3>
      <p>Fill out the form below and we'll get back to you as soon as possible.</p>
      <form>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName">Full Name*</label>
            <input type="text" id="fullName" placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address*</label>
            <input type="email" id="email" placeholder="your@email.com" />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="organization">Organization (Optional)</label>
          <input type="text" id="organization" placeholder="Company, city government, nonprofit, etc." />
        </div>
        <div className="form-group">
            <label htmlFor="inquiryType">Inquiry Type*</label>
            <select id="inquiryType">
                <option>Select an inquiry type</option>
            </select>
        </div>
        <div className="form-group">
          <label htmlFor="subject">Subject*</label>
          <input type="text" id="subject" placeholder="A short description of your inquiry" />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message*</label>
          <textarea id="message" rows="5" placeholder="Please provide details about your inquiry, question, or feedback."></textarea>
          <small>0/5000 characters</small>
        </div>
        <button type="submit" className="send-message-btn">Send Message</button>
      </form>
    </div>
  );
};

export default ContactForm;
