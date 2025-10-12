import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export default function Login() {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English (United Kingdom)');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep('password');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create a demo user object for login
    const demoUser = {
      id: '1',
      email: email,
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      twoFactorEnabled: false,
      quotaBytes: 15000000000, // 15GB
      usedBytes: 1000000000, // 1GB used
    };
    
    login(demoUser, 'demo-token', 'demo-refresh-token');
    navigate('/inbox');
  };

  const handleCreateAccount = (type: string) => {
    navigate('/register', { state: { accountType: type } });
  };

  if (step === 'password') {
    return (
      <div className="google-signin-container">
        <div className="google-signin-card">
          {/* Google Logo */}
          <div className="google-logo">
            <svg width="74" height="24" viewBox="0 0 74 24">
              <path fill="#4285F4" d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98.44 9.24.44c-5.48 0-9.94 4.28-9.94 9.56S3.76 19.56 9.24 19.56c2.69 0 4.72-.88 6.31-2.52 1.64-1.64 2.15-3.95 2.15-5.81 0-.57-.05-1.1-.14-1.54H9.24z"/>
              <path fill="#34A853" d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.47 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
              <path fill="#FBBC05" d="M53.58 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.47 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
              <path fill="#EA4335" d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.47 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
              <path fill="#4285F4" d="M64.96 6.2c-1.57 0-2.86.61-3.66 1.76l1.97 1.54c.66-.99 1.69-1.32 2.69-1.32 1.28 0 2.54.9 2.54 2.45v.27c-.59-.32-1.47-.68-2.88-.68-2.13 0-4.27 1.16-4.27 3.34 0 2.06 1.82 3.44 3.88 3.44.93 0 2.23-.48 2.88-1.05v.61h2.42V9.95c0-3.17-2.33-3.75-4.57-3.75zm-.25 9.13c-.73 0-1.75-.37-1.75-1.18 0-1.07 1.18-1.48 2.2-1.48.73 0 1.06.16 1.81.48-.32 1.15-1.53 2.18-2.26 2.18z"/>
            </svg>
          </div>

          {/* Welcome Back Section */}
          <div className="welcome-section">
            <h1>Welcome</h1>
            <div className="user-info">
              <div className="user-avatar">
                <div className="avatar-circle">{email.charAt(0).toUpperCase()}</div>
              </div>
              <div className="user-email">{email}</div>
              <button className="switch-account" onClick={() => setStep('email')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handlePasswordSubmit} className="signin-form">
            <div className="form-group">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="google-input"
                required
                autoFocus
              />
              <label className="google-label">Enter your password</label>
            </div>

            <div className="form-links">
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setStep('email')} className="secondary-btn">
                Back
              </button>
              <button type="submit" className="primary-btn">Next</button>
            </div>
          </form>

          {/* Guest Mode */}
          <div className="guest-mode">
            <p>Not your computer? Use Guest mode to sign in privately.</p>
            <Link to="/guest" className="guest-link">Learn more about using Guest mode</Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="google-footer">
          <div className="footer-left">
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-select"
            >
              <option>English (United Kingdom)</option>
              <option>English (United States)</option>
              <option>Español</option>
              <option>Français</option>
              <option>Deutsch</option>
            </select>
          </div>
          <div className="footer-right">
            <Link to="/help">Help</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="google-signin-container">
      <div className="google-signin-card">
        {/* Google Logo */}
        <div className="google-logo">
          <svg width="74" height="24" viewBox="0 0 74 24">
            <path fill="#4285F4" d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98.44 9.24.44c-5.48 0-9.94 4.28-9.94 9.56S3.76 19.56 9.24 19.56c2.69 0 4.72-.88 6.31-2.52 1.64-1.64 2.15-3.95 2.15-5.81 0-.57-.05-1.1-.14-1.54H9.24z"/>
            <path fill="#34A853" d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.47 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
            <path fill="#FBBC05" d="M53.58 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.47 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
            <path fill="#EA4335" d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.47 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/>
            <path fill="#4285F4" d="M64.96 6.2c-1.57 0-2.86.61-3.66 1.76l1.97 1.54c.66-.99 1.69-1.32 2.69-1.32 1.28 0 2.54.9 2.54 2.45v.27c-.59-.32-1.47-.68-2.88-.68-2.13 0-4.27 1.16-4.27 3.34 0 2.06 1.82 3.44 3.88 3.44.93 0 2.23-.48 2.88-1.05v.61h2.42V9.95c0-3.17-2.33-3.75-4.57-3.75zm-.25 9.13c-.73 0-1.75-.37-1.75-1.18 0-1.07 1.18-1.48 2.2-1.48.73 0 1.06.16 1.81.48-.32 1.15-1.53 2.18-2.26 2.18z"/>
          </svg>
        </div>

        {/* Sign In Section */}
        <div className="signin-section">
          <h1>Sign in</h1>
          <p>to continue to Gmail</p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="signin-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email or phone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="google-input"
              required
              autoFocus
            />
            <label className="google-label">Email or phone</label>
          </div>

          <div className="form-links">
            <Link to="/forgot-email" className="forgot-link">Forgot email?</Link>
          </div>

          {/* Guest Mode */}
          <div className="guest-mode">
            <p>Not your computer? Use Guest mode to sign in privately.</p>
            <Link to="/guest" className="guest-link">Learn more about using Guest mode</Link>
          </div>

          <div className="form-actions">
            <div className="create-account-section">
              <button 
                type="button" 
                onClick={() => setShowCreateOptions(!showCreateOptions)}
                className="create-account-btn"
              >
                Create account
              </button>
              
              {showCreateOptions && (
                <div className="create-options-dropdown">
                  <button onClick={() => handleCreateAccount('personal')}>
                    For my personal use
                  </button>
                  <button onClick={() => handleCreateAccount('child')}>
                    For my child
                  </button>
                  <button onClick={() => handleCreateAccount('business')}>
                    For work or my business
                  </button>
                </div>
              )}
            </div>
            
            <button type="submit" className="primary-btn">Next</button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="google-footer">
        <div className="footer-left">
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="language-select"
          >
            <option>English (United Kingdom)</option>
            <option>English (United States)</option>
            <option>Español</option>
            <option>Français</option>
            <option>Deutsch</option>
          </select>
        </div>
        <div className="footer-right">
          <Link to="/help">Help</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </footer>
    </div>
  );
}