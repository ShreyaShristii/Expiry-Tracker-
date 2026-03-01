import { useState } from "react";

export default function Signup({ onLogin, switchMode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      localStorage.setItem("token", data.token);
      onLogin(data.token);
    } else {
      setError(data.message || "Signup failed. Try again.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Jost:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7F3EE; font-family: 'Jost', sans-serif; }

        .auth-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F7F3EE;
          padding: 24px;
        }
        .auth-card {
          background: #fff;
          border: 1px solid #EAE4DC;
          border-radius: 20px;
          padding: 48px 44px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 12px 40px rgba(60,45,30,.08);
        }
        .auth-card h1 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #211E1A;
          margin-bottom: 6px;
        }
        .auth-card p {
          font-size: 13px;
          color: #A09080;
          font-weight: 300;
          margin-bottom: 36px;
        }
        .auth-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #B0A498;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .auth-input {
          width: 100%;
          background: #FAF8F5;
          border: 1px solid #E2DAD0;
          border-radius: 10px;
          padding: 12px 15px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: #3A3228;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          margin-bottom: 20px;
        }
        .auth-input::placeholder { color: #C4BAB0; }
        .auth-input:focus {
          border-color: #A8957E;
          box-shadow: 0 0 0 3px rgba(168,149,126,.12);
        }
        .auth-btn {
          width: 100%;
          padding: 13px;
          background: #3A3228;
          border: none;
          border-radius: 10px;
          color: #F7F3EE;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background .2s, box-shadow .2s;
          margin-top: 4px;
          letter-spacing: 0.3px;
        }
        .auth-btn:hover { background: #211E1A; box-shadow: 0 4px 16px rgba(33,30,26,.18); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-error {
          color: #A94040;
          font-size: 13px;
          margin-bottom: 16px;
          background: #FBF0F0;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .auth-switch {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #A09080;
        }
        .auth-switch button {
          background: none;
          border: none;
          color: #3A3228;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
      `}</style>

      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Create account</h1>
          <p>Start tracking your subscriptions today.</p>

          {error && <div className="auth-error">⚠ {error}</div>}

          <label className="auth-label">Name</label>
          <input
            className="auth-input"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && signup()}
          />

          <button className="auth-btn" onClick={signup} disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>

          <div className="auth-switch">
            Already have an account?{" "}
            <button onClick={switchMode}>Sign in</button>
          </div>
        </div>
      </div>
    </>
  );
}
