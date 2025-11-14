import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "./ForgetPassword.css";
import axios from "axios";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // Step 1: enter email, Step 2: enter new password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendEmail = async () => {
    if (!email) return setMessage("Please enter your email.");
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/user/forgot-password`, { email });
      setMessage(res.data.message);
      // In real case, user gets token in email. Here we simulate by allowing input
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending email.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) return setMessage("Please enter both password fields.");
    if (password !== confirmPassword) return setMessage("Passwords do not match.");
    if (!token) return setMessage("Invalid token.");

    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/user/reset-password/${token}`, { password, confirmPassword });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resetting password.");
    }
    setLoading(false);
  };

  return (
    <div className="forget-container">
      {/* Header */}
      <header className="header-top">
        <div className="logo-section">
          
          <div className="logo-text">CivicEye</div>
        </div>
      </header>

      <main className="forget-main">
        <h2>Forgot Password</h2>
        {message && <p className="message">{message}</p>}

        {step === 1 ? (
          <div className="form-container">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleSendEmail} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"} <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="form-container">
            <input
              type="text"
              placeholder="Enter reset token (from email)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button onClick={handleResetPassword} disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 CivicEye. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ForgetPassword;
