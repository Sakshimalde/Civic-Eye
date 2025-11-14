import React from 'react';
import { Mail, Phone, Globe } from 'lucide-react';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used for footer links
import '../pages/Footer.css'; // Link to its own CSS

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-column footer-logo-section">
                <div className="logo-section">
                    
                    <div className="logo-text">CivicEye</div>
                </div>
                <p className="footer-tagline">Civic Engagement Platform</p>
                <p>Empowering communities to report, track, and resolve civic issues through collaborative engagement between citizens and local authorities.</p>
                <div className="contact-info">
                    <p><Mail size={16} /> <a href="mailto:hello@civiceye.org">hello@civiceye.org</a></p>
                    <p><Phone size={16} /> <a href="tel:5551234567">(555) 123-4567</a></p>
                    <p><Globe size={16} /> <a href="http://www.civiceye.org" target="_blank" rel="noopener noreferrer">www.civiceye.org</a></p>
                </div>
            </div>
            <div className="footer-column">
                <h4>Platform</h4>
                <ul>
                    <li><Link to="/how-it-works">How it Works</Link></li>
                    <li><Link to="/features">Features</Link></li>
                    <li><Link to="/pricing">Pricing</Link></li>
                    <li><Link to="/mobile-app">Mobile App</Link></li>
                </ul>
            </div>
            <div className="footer-column">
                <h4>Support</h4>
                <ul>
                    <li><Link to="/help-center">Help Center</Link></li>
                    <li><Link to="/contact-us">Contact Us</Link></li>
                    <li><Link to="/user-guide">User Guide</Link></li>
                    <li><Link to="/community-forum">Community Forum</Link></li>
                </ul>
            </div>
            <div className="footer-column">
                <h4>Company</h4>
                <ul>
                    <li><Link to="/about">About Us</Link></li>
                    <li><Link to="/careers">Careers</Link></li>
                    <li><Link to="/press">Press Kit</Link></li>
                    <li><Link to="/blog">Blog</Link></li>
                </ul>
            </div>
        </footer>
    );
};

export default Footer;