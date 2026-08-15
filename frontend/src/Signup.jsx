import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Signup({ onLogin, switchMode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      localStorage.setItem("token", data.token);
      // redirect user directly to dashboard after signup
      onLogin(data.token, "dashboard");
    } else {
      setError(data.message || "Signup failed. Try again.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0a0a; }

        .auth-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: #0a0a0a;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .auth-container {
            grid-template-columns: 1fr;
          }
          .auth-showcase {
            display: none;
          }
        }

        /* Left: Feature Showcase */
        .auth-showcase {
          background: linear-gradient(135deg, #612D53 0%, #853953 50%, #2C2C2C 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px 48px;
          color: #F3F0F2;
          z-index: 1;
        }

        .showcase-content {
          z-index: 2;
          position: relative;
        }

        .showcase-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 16px;
          line-height: 1.2;
          letter-spacing: -0.5px;
          animation: slideDown 0.6s ease-out;
        }

        .showcase-header p {
          font-size: 15px;
          opacity: 0.85;
          line-height: 1.6;
          max-width: 320px;
          font-weight: 400;
          animation: slideDown 0.6s ease-out 0.1s both;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .showcase-features {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 48px;
        }

        .feature-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .feature-item:nth-child(1) { animation-delay: 0.15s; }
        .feature-item:nth-child(2) { animation-delay: 0.25s; }
        .feature-item:nth-child(3) { animation-delay: 0.35s; }
        .feature-item:nth-child(4) { animation-delay: 0.45s; }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-icon {
          width: 24px;
          height: 24px;
          min-width: 24px;
          margin-top: 2px;
          color: #FFC857;
        }

        .feature-text {
          flex: 1;
        }

        .feature-text h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .feature-text p {
          font-size: 13px;
          opacity: 0.75;
          line-height: 1.5;
        }

        .showcase-footer {
          margin-top: 60px;
          padding-top: 24px;
          border-top: 1px solid rgba(243, 240, 242, 0.1);
          font-size: 12px;
          opacity: 0.65;
          animation: fadeIn 0.8s ease-out 0.6s forwards;
          animation-fill-mode: both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.65; }
        }

        /* Background decorative elements */
        .showcase-bg {
          position: absolute;
          top: -40%;
          right: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 200, 87, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
          animation: float 6s ease-in-out infinite;
        }

        .showcase-bg-2 {
          position: absolute;
          bottom: -20%;
          left: -5%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(153, 102, 204, 0.06) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
          animation: float 8s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }

        /* Right: Form */
        .auth-form-section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 40px;
          background: #F3F0F2;
          position: relative;
          overflow-y: auto;
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 380px;
          animation: formFadeIn 0.5s ease-out;
        }

        @keyframes formFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .form-header p {
          font-size: 14px;
          color: #999;
          font-weight: 400;
        }

        .form-field {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 13px 15px;
          background: #fff;
          border: 1.5px solid #E0DDD8;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #2C2C2C;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input::placeholder {
          color: #CCC;
        }

        .form-input:focus {
          border-color: #853953;
          box-shadow: 0 0 0 3px rgba(133, 57, 83, 0.08);
          background: #fafafa;
        }

        .password-input-wrapper {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .toggle-password:hover {
          color: #666;
        }

        .error-message {
          color: #C85A5A;
          font-size: 13px;
          margin-bottom: 16px;
          background: #FFF0F0;
          padding: 12px 14px;
          border-radius: 6px;
          border-left: 3px solid #C85A5A;
          animation: slideDown 0.3s ease-out;
        }

        .submit-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #853953 0%, #612D53 100%);
          color: #F3F0F2;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(133, 57, 83, 0.25);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-toggle {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #999;
        }

        .form-toggle button {
          background: none;
          border: none;
          color: #853953;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
          margin-left: 4px;
        }

        .form-toggle button:hover {
          color: #612D53;
        }
      `}</style>

      <div className="auth-container">
        {/* Left: Showcase */}
        <div className="auth-showcase">
          <div className="showcase-bg"></div>
          <div className="showcase-bg-2"></div>

          <div className="showcase-content">
            <div className="showcase-header">
              <h2>Start Tracking</h2>
              <p>Never miss an expiry date again. Organize everything that matters.</p>
            </div>

            <div className="showcase-features">
              <div className="feature-item">
                <CheckCircle2 className="feature-icon" />
                <div className="feature-text">
                  <h3>Multi-Category Tracking</h3>
                  <p>OTT subscriptions, groceries, medicines, documents & more</p>
                </div>
              </div>

              <div className="feature-item">
                <CheckCircle2 className="feature-icon" />
                <div className="feature-text">
                  <h3>Smart Notifications</h3>
                  <p>Get alerts before expiry dates so you never miss a renewal</p>
                </div>
              </div>

              <div className="feature-item">
                <CheckCircle2 className="feature-icon" />
                <div className="feature-text">
                  <h3>Warranty Management</h3>
                  <p>Track gadget warranties and coverage dates effortlessly</p>
                </div>
              </div>

              <div className="feature-item">
                <CheckCircle2 className="feature-icon" />
                <div className="feature-text">
                  <h3>Organized Dashboard</h3>
                  <p>View all your items at a glance with our intuitive interface</p>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            ✨ Built for people who care about staying organized
          </div>
        </div>

        {/* Right: Form */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h1>Create Account</h1>
              <p>Join thousands tracking smarter</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-field">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && signup()}
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && signup()}
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="submit-btn" onClick={signup} disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <div className="form-toggle">
              Already have an account?
              <button onClick={switchMode} disabled={loading}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
