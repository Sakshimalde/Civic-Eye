import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowRight,
  Camera,
  MapPin,
  Users,
  Clock,
  MessageCircle,
  BarChart3,
  Shield,
  CheckCircle,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignIn = () => navigate("/login");
  const handleGetStarted = () => navigate("/signup");

  // Role-based dashboard navigation
  const handleDashboard = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "volunteer") {
      navigate("/volunteer", { state: { userType: "volunteer" } });
    } else if (user.role === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  // Slideshow image array
  const slideshowImages = [
    "images/road1.jpg",
    "images/streetlight.webp",
    "images/community.jpg",
    "images/street.jpg",
    "images/waste1.jpg",
    "images/dashboard.jpg",
    "images/road2.webp",
    "images/street1.png",
    "images/waste.png",
    
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto change every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideshowImages.length]);

  const features = [
    {
      icon: Camera,
      title: "Photo Reports",
      description:
        "Upload photos to document issues clearly and help authorities understand the problem.",
    },
    {
      icon: MapPin,
      title: "GPS Location",
      description:
        "Automatically capture precise location data to ensure issues are addressed at the right spot.",
    },
    {
      icon: Users,
      title: "Community Voting",
      description:
        "Let the community vote on issues to prioritize the most important problems.",
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Track the status of your reports in real-time.",
    },
    {
      icon: MessageCircle,
      title: "Community Discussion",
      description:
        "Engage with neighbors and officials to build a collaborative solution.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Local authorities can monitor trends and generate reports for strategic planning.",
    },
  ];

  return (
    <div className="home-container">
      <header className="header-top">
        <nav className="nav-links">
          <Link to="/" className="active">
            Home
          </Link>
          <Link to="/help">Help</Link>
          <Link to="/about">About</Link>
        </nav>

        <div className="auth-buttons">
          <button onClick={handleSignIn} className="sign-in-btn">
            Sign In <ArrowRight size={16} />
          </button>
          <button onClick={handleGetStarted} className="get-started-btn">
            Get Started
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section with slideshow background */}
        <section
          className="hero-main"
          style={{
            backgroundImage: `url(${slideshowImages[currentSlide]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transition: "background-image 1s ease-in-out",
            position: "relative",
          }}
        >
          <div className="overlay"></div>
          <div
            className="hero-overlay"
            style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 0,
        }}
      ></div>
          <div className="hero-content">
            <p className="hero-badge-small">Make your Community Better</p>
            <h1 className="hero-titleeee">
              <span className="highlight-text">CivicEye</span>
            </h1>
            <p className="hero-subtitle">
              CivicEye is a smart civic engagement platform that empowers
              citizens to report local issues, track their resolution, and build
              stronger communities through collaborative action.
            </p>
            <div className="hero-action-buttons-alt">
              {user ? (
                <button
                  onClick={handleDashboard}
                  className="get-started-free-btn"
                >
                  Go to Dashboard <ArrowRight size={20} />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleGetStarted}
                    className="get-started-free-btn"
                  >
                    Get Started Free <ArrowRight size={20} />
                  </button>
                  <button className="learn-more-btn">Learn More</button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <h2>How It Works</h2>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-icon-container">
                <div className="step-icon">
                  <Camera size={32} color="#2c5292" />
                </div>
                <div className="step-number">1</div>
              </div>
              <h3>Report an Issue</h3>
              <p>
                Take a photo and describe the civic issue you've encountered in
                your neighborhood.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon-container">
                <div className="step-icon">
                  <Users size={32} color="#2c5292" />
                </div>
                <div className="step-number">2</div>
              </div>
              <h3>Community Engagement</h3>
              <p>
                Other residents can vote and comment on your report to show
                community support.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon-container">
                <div className="step-icon">
                  <Shield size={32} color="#2c5292" />
                </div>
                <div className="step-number">3</div>
              </div>
              <h3>Official Review</h3>
              <p>
                Local authorities review and prioritize issues based on
                community input and severity.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon-container">
                <div className="step-icon">
                  <CheckCircle size={32} color="#2c5292" />
                </div>
                <div className="step-number">4</div>
              </div>
              <h3>Resolution & Updates</h3>
              <p>
                Track the progress of your report and get notified when the
                issue is resolved.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2>Our Modules</h2>

          <div className="features-grid">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="feature-card-item">
                  <div
                    className="feature-icon-container"
                    style={{ backgroundColor: "#e2e8f0" }}
                  >
                    <Icon size={28} color="#2c5292" />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feedback Section */}
        <section className="testimonials-section">
          <h2>Feedbacks!</h2>
          <p className="subtitle">Real stories from real people</p>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="stars">★★★★</div>
              <p>
                "CivicEye made it so easy to report the pothole on my street. It
                was fixed within a week!"
              </p>
              <h4>Vaidehi Jadhav</h4>
              <p className="role">Resident</p>
            </div>
            <div className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p>
                "I love how I can track all the issues in my neighborhood and
                help coordinate with city officials."
              </p>
              <h4>Vrushabh Rukade</h4>
              <p className="role">Community Volunteer</p>
            </div>
            <div className="testimonial-card">
              <div className="stars">★★★★</div>
              <p>
                "The analytics dashboard gives us invaluable insights into
                community needs and helps us prioritize resources."
              </p>
              <h4>Sakshi Malde</h4>
              <p className="role">City Administrator</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta-section">
          <h2>SignUP?</h2>
          <div className="hero-action-buttons">
            {user ? (
              <button onClick={handleDashboard} className="sign-up-btn">
                Go to Dashboard <ArrowRight size={20} />
              </button>
            ) : (
              <button onClick={handleGetStarted} className="sign-up-btn">
                Sign Up Now <ArrowRight size={20} />
              </button>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-column footer-logo-section">
          <div className="logo-section">
            <div className="logo-text">CivicEye</div>
          </div>
          <p className="footer-tagline">Civic Engagement Platform</p>
          <p>
            Empowering communities to report, track, and resolve civic issues
            through collaborative engagement between citizens and local
            authorities.
          </p>
          <div className="contact-info">
            <p>
              <Mail size={16} />{" "}
              <a href="mailto:hello@civiceye.org">hello@civiceye.org</a>
            </p>
            <p>
              <Phone size={16} /> <a href="tel:5551234567">(555) 123-4567</a>
            </p>
            <p>
              <Globe size={16} />{" "}
              <a
                href="http://www.civiceye.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.civiceye.org
              </a>
            </p>
          </div>
        </div>
        <div className="footer-column">
          <h4>Platform</h4>
          <ul>
            <li>
              <Link to="/how-it-works">How it Works</Link>
            </li>
            <li>
              <Link to="/features">Features</Link>
            </li>
            <li>
              <Link to="/pricing">Pricing</Link>
            </li>
            <li>
              <Link to="/mobile-app">Mobile App</Link>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Support</h4>
          <ul>
            <li>
              <Link to="/help">Help Center</Link>
            </li>
            <li>
              <Link to="/contactpage">Contact Us</Link>
            </li>
            <li>
              <Link to="/user-guide">User Guide</Link>
            </li>
            <li>
              <Link to="/community-forum">Community Forum</Link>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Company</h4>
          <ul>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/careers">Careers</Link>
            </li>
            <li>
              <Link to="/press">Press Kit</Link>
            </li>
            <li>
              <Link to="/blog">Blog</Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default Home;
