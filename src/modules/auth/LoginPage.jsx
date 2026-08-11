import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';

const QUOTES = [
  { text: 'Every policy you write is a promise someone can lean on.', author: 'The work behind the work' },
  { text: 'Insurance is the quiet peace of mind families rarely thank you for — but always feel.', author: '' },
  { text: 'A claim settled well is a family made whole again.', author: '' },
  { text: 'The best advisors are remembered not for the sale, but for showing up when it mattered.', author: '' },
  { text: 'Behind every policy number is a person who trusted you to get it right.', author: '' },
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const now = useClock();
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const quote = QUOTES[quoteIdx];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter email and password'); return; }
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-hero-glow auth-hero-glow-1" />
        <div className="auth-hero-glow auth-hero-glow-2" />
        <div className="auth-hero-content">
          <div className="auth-hero-top">
            <div className="auth-hero-mark"><i className="ti ti-shield-check" /></div>
            <span className="auth-hero-brand">MyAdvisor CRM</span>
          </div>

          <div className="auth-hero-mid">
            <div className="auth-hero-quote-mark">"</div>
            <p className="auth-hero-quote">{quote.text}</p>
          </div>

          <div className="auth-hero-bottom">
            <div className="auth-hero-time">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="auth-hero-date">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-card" onSubmit={submit}>
          <div className="logo-mark-lg"><i className="ti ti-shield-check" /></div>
          <h1>Welcome back</h1>
          <p className="auth-sub">Sign in to your account</p>
          <div className="auth-fld">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" />
          </div>
          <div className="auth-fld">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <div className="auth-err">{error}</div>}
          <button className="auth-btn" type="submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="auth-footer-note">Protecting what matters, one client at a time.</p>
        </form>
      </div>
    </div>
  );
}
