import React, { useState, useMemo } from 'react';

const WEAK_PASSWORDS = [
  '123456', '12345678', '123456789', 'password', 'password1',
  '0000', '00000000', '111111', 'qwerty', 'abc123',
  'letmein', 'welcome', 'monkey', 'master', 'dragon',
  'login', 'princess', 'admin', 'iloveyou'
];

function validatePassword(pw) {
  const rules = {
    length: pw.length >= 8 && pw.length <= 64,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
  const notWeak = !WEAK_PASSWORDS.includes(pw.toLowerCase());
  const passed = Object.values(rules).filter(Boolean).length;
  let strength = 'weak';
  if (passed >= 5 && notWeak) strength = 'strong';
  else if (passed >= 4) strength = 'good';
  else if (passed >= 3) strength = 'fair';

  return { rules, notWeak, strength, allPassed: passed === 5 && notWeak };
}

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validation = useMemo(() => validatePassword(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    if (!isLogin) {
      if (!validation.allPassed) {
        setError('Please meet all password requirements');
        return;
      }
      if (!validation.notWeak) {
        setError('This password is too common. Please choose a stronger one.');
        return;
      }
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  const strengthColors = {
    weak: 'active-weak',
    fair: 'active-fair',
    good: 'active-good',
    strong: 'active-strong',
  };
  const strengthIndex = { weak: 1, fair: 2, good: 3, strong: 4 };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-card fade-in">
          <div className="auth-brand">
            <div className="auth-brand-icon">T</div>
            <div className="auth-brand-text">TrafficAI</div>
          </div>
          <p className="auth-subtitle">
            {isLogin
              ? 'Sign in to access AI-powered traffic predictions'
              : 'Create an account to get started'}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="auth-label">Email or Phone Number</label>
              <input
                className={`auth-input ${error && !identifier ? 'error' : ''}`}
                type="text"
                placeholder="you@example.com or +91 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="auth-label">Password</label>
              <input
                className={`auth-input ${error && !isLogin && !validation.allPassed ? 'error' : ''}`}
                type="password"
                placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {!isLogin && password.length > 0 && (
                <>
                  <div className="password-strength">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`strength-bar ${i <= strengthIndex[validation.strength] ? strengthColors[validation.strength] : ''}`}
                      />
                    ))}
                  </div>
                  <div className={`strength-text ${validation.strength}`}>
                    {validation.strength === 'weak' && 'Weak — needs improvement'}
                    {validation.strength === 'fair' && 'Fair — almost there'}
                    {validation.strength === 'good' && 'Good — add more variety'}
                    {validation.strength === 'strong' && 'Strong password ✓'}
                  </div>

                  <div className="password-rules">
                    <span className={`rule ${validation.rules.length ? 'pass' : ''}`}>
                      {validation.rules.length ? '✓' : '○'} 8+ characters
                    </span>
                    <span className={`rule ${validation.rules.uppercase ? 'pass' : ''}`}>
                      {validation.rules.uppercase ? '✓' : '○'} Uppercase
                    </span>
                    <span className={`rule ${validation.rules.lowercase ? 'pass' : ''}`}>
                      {validation.rules.lowercase ? '✓' : '○'} Lowercase
                    </span>
                    <span className={`rule ${validation.rules.number ? 'pass' : ''}`}>
                      {validation.rules.number ? '✓' : '○'} Number
                    </span>
                    <span className={`rule ${validation.rules.special ? 'pass' : ''}`}>
                      {validation.rules.special ? '✓' : '○'} Special char
                    </span>
                  </div>
                </>
              )}
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? (
              <>Don't have an account? <span onClick={() => { setIsLogin(false); setError(''); }}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => { setIsLogin(true); setError(''); }}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
