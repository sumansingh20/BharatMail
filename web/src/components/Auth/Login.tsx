import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (email.trim()) {
      // Simulate authentication - in real app, this would connect to auth service
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      navigate('/dashboard');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* BhaMail Logo */}
        <div className="bhamail-logo">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <rect width="48" height="48" rx="8" fill="#4A90E2"/>
            <path fill="white" d="M12 14h24a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z"/>
            <path fill="#4A90E2" d="M12 16l12 8 12-8v-2l-12 8-12-8v2z"/>
            <text x="24" y="40" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Bha</text>
          </svg>
        </div>

        {/* Sign in Header */}
        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">to continue to BhaMail</p>

        {/* Email Input */}
        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Email or phone"
            className="email-input"
            autoFocus
          />
        </div>

        {/* Forgot Email Link */}
        <a href="#" className="forgot-email">Forgot email?</a>

        {/* Guest Mode Info */}
        <div className="guest-mode-info">
          <p>Not your computer? Use Guest mode to sign in privately.</p>
          <a href="#" className="learn-more">Learn more about using Guest mode</a>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <div className="create-account-section">
            <button 
              className="create-account-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              Create account
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <button className="dropdown-item">For my personal use</button>
                <button className="dropdown-item">For my child</button>
                <button className="dropdown-item">For work or my business</button>
              </div>
            )}
          </div>

          <button className="next-btn" onClick={handleNext}>
            Next
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <div className="language-selector">
          <select className="language-select" title="Select language">
            <option value="en-GB">English (United Kingdom)</option>
            <option value="en-US">English (United States)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        
        <div className="footer-links">
          <a href="#">Help</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </div>
  );
};

export default Login;