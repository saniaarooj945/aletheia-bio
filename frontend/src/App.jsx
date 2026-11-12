import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const TOKEN_KEY = 'aletheia-auth-token';
const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  const url = error.config?.url || '';
  if (error.response?.status === 401 && !url.includes('/api/auth/login')) {
    window.dispatchEvent(new Event('aletheia:session-expired'));
  }
  return Promise.reject(error);
});

const modulesList = [
  { id: 'protein', title: 'Proteomics Engine', desc: 'UniProt & Biophysical Metrics', accent: '#e4f5f4', accentStrong: '#087f8c', icon: 'protein' },
  { id: 'structure', title: '3D Structure Viewer', desc: 'Interactive 3D/MD Rendering', accent: '#eff6ff', accentStrong: '#15365b', icon: 'structure' },
  { id: 'phylogeny', title: 'Dynamic Phylogenetics Tree', desc: 'FASTA Alignment & Graphical Tree', accent: '#dcfce7', accentStrong: '#16a34a', icon: 'phylogeny' },
  { id: 'molecule', title: 'ChemInformatics (RDKit)', desc: 'Small-Molecule Drug Analysis', accent: '#fee2e2', accentStrong: '#dc2626', icon: 'molecule' },
  { id: 'gene', title: 'Genomics (NCBI)', desc: 'Gene & Nucleotide Search', accent: '#fef3c7', accentStrong: '#d97706', icon: 'gene' },
  { id: 'docking', title: 'CADD & Docking Studio', desc: 'Dynamic Protein-Ligand Simulation', accent: '#e0f2fe', accentStrong: '#0284c7', icon: 'docking' },
  { id: 'agent', title: 'AI Agent View', desc: 'Natural Language Router', accent: '#f3e8ff', accentStrong: '#9333ea', icon: 'agent' },
];

const moduleInputs = {
  protein: { label: 'Protein sequence or UniProt accession', placeholder: 'Paste a protein sequence or enter a UniProt ID (e.g. P68871)...' },
  structure: { label: 'UniProt accession', placeholder: 'Enter a UniProt ID (e.g. P68871)...' },
  phylogeny: { label: 'FASTA sequences', placeholder: 'Paste at least two sequences in FASTA format...' },
  molecule: { label: 'SMILES or compound structure', placeholder: 'Enter a SMILES string (e.g. CCO)...' },
  gene: { label: 'Gene symbol', placeholder: 'Enter a gene symbol (e.g. TP53)...' },
  docking: { label: 'Protein and ligand inputs', placeholder: 'Paste the protein sequence...' },
  agent: { label: 'Research question', placeholder: 'Ask the AI agent to route a research question...' },
};

const moduleExamples = {
  protein: ['P68871', 'P00042', 'P01308'],
  structure: ['P68871', 'P01308', 'Q9Y261'],
  phylogeny: [
    {
      label: 'Two-sequence FASTA',
      value: '>sequence_1\nMKWVTFISLLFLFSSAYS\n>sequence_2\nMKWVTFISLLFLFSSAYA',
    },
  ],
  molecule: ['CCO', 'CC(=O)OC1=CC=CC=C1C(=O)O', 'C1=CC=CC=C1'],
  gene: ['TP53', 'BRCA1', 'EGFR'],
  docking: [
    {
      label: 'Hemoglobin + ethanol',
      proteinSequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR',
      ligandSmiles: 'CCO',
    },
  ],
  agent: ['Analyze protein P68871', 'Find 3D structure for P68871', 'Analyze aspirin'],
};

const moduleHighlights = {
  protein: [['🧬', 'Protein properties', 'MW, pI, stability'], ['🧊', 'Structure insights', 'Domains & motifs'], ['🔗', 'Functional analysis', 'GO terms & pathways'], ['📊', 'Sequence metrics', 'Composition & hydrophobicity']],
  structure: [['🧊', 'Model confidence', 'AlphaFold confidence'], ['🧬', 'Protein model', 'PDB structure link'], ['🔍', 'Structural metrics', 'Model metadata'], ['📊', 'Quality insights', 'Validation scores']],
  phylogeny: [['🌿', 'Sequence alignment', 'FASTA records'], ['🌳', 'Phylogenetic tree', 'Newick output'], ['🧪', 'Distance matrix', 'Identity distance'], ['📊', 'Comparative analysis', 'Related sequences']],
  molecule: [['⚗️', 'Molecular weight', 'Calculated by RDKit'], ['🧪', 'Drug likeness', 'Lipinski rules'], ['🔗', 'Lipophilicity', 'LogP and TPSA'], ['📊', 'Structure metrics', 'H-bond counts']],
  gene: [['🧬', 'Gene identity', 'Symbol and accession'], ['🌎', 'Organism', 'NCBI record'], ['🔍', 'Gene summary', 'Description and location'], ['📚', 'Source', 'NCBI Entrez']],
  docking: [['🧬', 'Protein metrics', 'Sequence properties'], ['⚗️', 'Ligand metrics', 'SMILES descriptors'], ['🎯', 'Binding estimate', 'Scoring output'], ['📊', 'Interaction profile', 'Simulation summary']],
  agent: [['🤖', 'Query routing', 'Domain selection'], ['🔬', 'Research context', 'Omics workflows'], ['🧭', 'Tool guidance', 'Suggested next steps'], ['📊', 'Structured response', 'Agent output']],
};

function getModuleById(moduleId) {
  return modulesList.find((module) => module.id === moduleId) || null;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 15c6.667-6 13.333 0 20-6M2 9c6.667 6 13.333 0 20 6" />
        <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

function ModuleIcon({ moduleId }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const paths = {
    protein: <><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6M12 9v6" /></>,
    structure: <><path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" /><path d="M4 12.5 12 16l8-3.5M4 17.5 12 21l8-3.5" /></>,
    phylogeny: <><path d="M4 18h6M14 18h6M10 18V8m4 10V6M9 8h6" /><path d="M7 8h10" /></>,
    molecule: <><path d="M12 3 5 7v10l7 4 7-4V7l-7-4Z" /><path d="M12 3v18M5 7l7 4 7-4" /></>,
    gene: <><path d="M4 9c0-3 3-5 8-5s8 2 8 5-3 5-8 5-8 2-8 5 3 5 8 5 8-2 8-5" /><path d="M8 12h8" /></>,
    docking: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 3v18M3 12h18" /></>,
    agent: <><rect x="5" y="7" width="14" height="10" rx="2" /><path d="M9 12h6M12 9v6M8 5h8" /></>,
  };

  return <svg {...commonProps}>{paths[moduleId] || <circle cx="12" cy="12" r="8" />}</svg>;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function storeToken(token, rememberMe) {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  (rememberMe ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

function getHistoryKey(email) {
  return `aletheia-analysis-history:${email}`;
}

function readHistory(email) {
  try {
    const stored = JSON.parse(localStorage.getItem(getHistoryKey(email)) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error('Could not read the saved analysis history.', error);
    return [];
  }
}

function saveHistory(email, moduleId) {
  try {
    const record = {
      id: crypto.randomUUID(),
      moduleId,
      createdAt: new Date().toISOString(),
      status: 'Completed',
    };
    const records = [record, ...readHistory(email)].slice(0, 50);
    localStorage.setItem(getHistoryKey(email), JSON.stringify(records));
  } catch (error) {
    console.error('The analysis completed, but its history could not be saved.', error);
  }
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AB';
}

function AuthShell({ children }) {
  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="hero-brand-row">
          <BrandMark />
          <div>
            <h3>Aletheia Bio</h3>
            <p>Enterprise Multi-Omics Agent</p>
          </div>
        </div>

        <div className="hero-copy">
          <span className="hero-eyebrow">SCIENTIFIC DISCOVERY, CONNECTED</span>
          <h1>Smarter Insights.<br /><span>Deeper Biology.</span></h1>
          <p>Integrating genomics, proteomics and drug design with AI to accelerate research and discovery.</p>
          <div className="feature-stack">
            <div className="feature-pill">
              <span className="mini-icon">🧬</span>
              <div><strong>Multi-Omics Analysis</strong><small>Genomics · Proteomics · Drug Design</small></div>
            </div>
            <div className="feature-pill">
              <span className="mini-icon">✦</span>
              <div><strong>Authoritative Sources</strong><small>NCBI · UniProt · RCSB PDB · PubChem</small></div>
            </div>
            <div className="feature-pill">
              <span className="mini-icon">⚡</span>
              <div><strong>AI-Powered Research</strong><small>Reliable, reproducible scientific workflows</small></div>
            </div>
          </div>
        </div>
        <div className="hero-footer">From Data <span>→</span> To Discovery</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-brand">
            <BrandMark />
            <div>
              <h3>Aletheia Bio</h3>
              <p>Enterprise Multi-Omics Agent</p>
            </div>
          </div>
          {children}
          <div className="trust-row"><span>Secure</span><span>·</span><span>Private by design</span><span>·</span><span>Built for Science</span></div>
        </div>
      </section>
      <span className="login-art" aria-hidden="true">
        <svg viewBox="0 0 280 380" fill="none">
          <path d="M45 30C245 105 35 270 235 350M235 30C35 105 245 270 45 350" />
          <path d="M72 55h136M48 95h184M56 140h168M85 185h110M55 230h170M46 275h188M69 320h142" />
          <circle cx="45" cy="30" r="6" /><circle cx="235" cy="30" r="6" />
          <circle cx="45" cy="350" r="6" /><circle cx="235" cy="350" r="6" />
        </svg>
      </span>
    </main>
  );
}

function LoginPage({ onAuthenticated, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });
      storeToken(response.data.access_token, rememberMe);
      onAuthenticated(response.data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to sign in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2>Welcome Back</h2>
      <p className="subheading">Sign in to continue to your research workspace</p>
      {(notice || error) && <div className="form-alert error" role="alert">{error || notice}</div>}
      {message && <div className="form-alert success" role="status">{message}</div>}
      <form onSubmit={handleLogin} className="login-form">
        <label className="field-group">
          <span>Email Address</span>
          <div className="input-shell">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" required maxLength={254} />
          </div>
        </label>
        <label className="field-group">
          <span>Password</span>
          <div className="input-shell password-shell">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required maxLength={128} />
            <button type="button" className="toggle-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </label>
        <div className="login-options">
          <label className="remember-box">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
            <span>Remember me</span>
          </label>
          <button type="button" className="text-button" onClick={() => setMessage('Password reset is not configured. Contact your workspace administrator to reset your account.')}>Forgot password?</button>
        </div>
        <button type="submit" className="primary-login-btn" disabled={loading}>{loading ? 'Signing in…' : '→  Sign In'}</button>
      </form>
      <div className="divider"><span>OR</span></div>
      <button type="button" className="google-btn" disabled title="Google OAuth is not configured for this installation">
        <span className="google-g">G</span>
        Continue with Google
      </button>
      <p className="auth-note">Google sign-in is not configured. <Link to="/register">Create an account</Link></p>
    </AuthShell>
  );
}

function RegisterPage({ onAuthenticated }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 12) {
      setError('Choose a password with at least 12 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        display_name: displayName.trim(),
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });
      storeToken(response.data.access_token, rememberMe);
      onAuthenticated(response.data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to create your account. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell registration>
      <h2>Create your account</h2>
      <p className="subheading">Set up your private research workspace</p>
      {error && <div className="form-alert error" role="alert">{error}</div>}
      <form onSubmit={handleRegister} className="login-form register-form">
        <label className="field-group">
          <span>Full Name</span>
          <div className="input-shell"><input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Enter your name" required minLength={2} maxLength={80} /></div>
        </label>
        <label className="field-group">
          <span>Email Address</span>
          <div className="input-shell"><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" required maxLength={254} /></div>
        </label>
        <label className="field-group">
          <span>Password <small>(12 characters minimum)</small></span>
          <div className="input-shell password-shell">
            <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" required minLength={12} maxLength={128} />
            <button type="button" className="toggle-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </label>
        <label className="field-group">
          <span>Confirm Password</span>
          <div className="input-shell"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required maxLength={128} /></div>
        </label>
        <label className="remember-box">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
          <span>Keep me signed in on this device</span>
        </label>
        <button type="submit" className="primary-login-btn" disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
      </form>
      <div className="divider"><span>ALREADY REGISTERED?</span></div>
      <Link to="/" className="google-btn create-account-link">Back to Sign In</Link>
      <p className="auth-note">One account per email address. Credentials are stored using salted password hashing.</p>
    </AuthShell>
  );
}

function SidebarLink({ to, label, icon, active, end = false }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `sidebar-item${(active === undefined ? isActive : active) ? ' active' : ''}`} title={label}>
      {icon}<span className="nav-label">{label}</span>
    </NavLink>
  );
}

function DashboardLayout({ user, onLogout, searchQuery, setSearchQuery, children }) {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const history = readHistory(user.email);
  const notificationsEnabled = getPreferences(user.email).notifications !== false;
  const moduleNavActive = location.pathname.startsWith('/module') || (location.pathname === '/dashboard' && location.hash === '#modules');
  const profileName = user.display_name || user.email;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar-brand">
          <BrandMark />
          <div><h4>Aletheia Bio</h4><p>Enterprise Multi-Omics Agent</p></div>
        </Link>
        <nav className="sidebar-menu" aria-label="Sidebar navigation">
          <SidebarLink to="/dashboard" label="Dashboard" active={location.pathname === '/dashboard' && location.hash !== '#modules'} end icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>} />
          <SidebarLink to="/dashboard#modules" label="Modules" active={moduleNavActive} end icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="m8.5 8.5 7 7M12 6v12" /></svg>} />
          <SidebarLink to="/history" label="History" end icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>} />
          <SidebarLink to="/settings" label="Settings" end icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a2 2 0 0 0-1.4-3.4h-.2a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a2 2 0 0 0 3.4-1.4v-.2a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a2 2 0 0 0 1.4 3.4h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.4 3.4Z" /></svg>} />
          <button type="button" className="sidebar-item sidebar-logout" onClick={onLogout} title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>
            <span className="nav-label">Sign out</span>
          </button>
        </nav>
        <div className="sidebar-footer">From Data <span>→</span><br />To Discovery</div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <label className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.35-4.35" /></svg>
            <input type="search" aria-label="Search modules" placeholder="Search modules..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </label>
          <div className="topbar-actions">
            <div className="notification-wrap">
              <button type="button" className="icon-button" aria-label={notificationsEnabled ? 'Notifications' : 'Notifications disabled'} aria-expanded={notificationsOpen} disabled={!notificationsEnabled} onClick={() => setNotificationsOpen((value) => !value)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M14 21a2 2 0 0 1-4 0" /></svg>
                {notificationsEnabled && history.length > 0 && <span className="notification-dot" />}
              </button>
              {notificationsOpen && (
                <div className="notification-popover" role="status">
                  <strong>Recent activity</strong>
                  {history[0]
                    ? <p>{getModuleById(history[0].moduleId)?.title || 'Research module'} completed an analysis.</p>
                    : <p>No activity yet. Complete a module analysis to see updates here.</p>}
                  <Link to="/history" onClick={() => setNotificationsOpen(false)}>View analysis history</Link>
                </div>
              )}
            </div>
            <div className="user-chip" title={user.email}>
              <span className="user-avatar">{getInitials(profileName)}</span>
              <span className="user-name">{profileName}</span>
            </div>
            <button type="button" className="header-logout" onClick={onLogout}>Sign out</button>
          </div>
        </header>
        <div className="content-frame">{typeof children === 'function' ? children(history) : children}</div>
      </main>
    </div>
  );
}

function DashboardPage({ searchQuery }) {
  const visibleModules = modulesList.filter((module) => `${module.title} ${module.desc}`.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div>
          <span className="welcome-eyebrow">YOUR RESEARCH WORKSPACE</span>
          <h1>Welcome back 👋</h1>
          <p>Your AI-powered research assistant for multi-omics analysis, drug discovery and more.</p>
          <div className="banner-pills"><span>🧬 Genomics</span><span>🔬 Proteomics</span><span>💊 Drug Design</span><span>📊 Research Insights</span></div>
        </div>
      </section>
      <section className="module-section" id="modules">
        <div className="section-heading">
          <div><span className="section-eyebrow">WORKSPACE</span><h2>Available Research Modules</h2><p>Choose a module to start your analysis.</p></div>
          <span className="module-count">{visibleModules.length} modules</span>
        </div>
        {visibleModules.length > 0 ? (
          <div className="module-grid">
            {visibleModules.map((module) => (
              <Link key={module.id} to={`/module/${module.id}`} className="module-card">
                <div className="module-card-left">
                  <div className="module-icon-box" style={{ background: module.accent, color: module.accentStrong }}><ModuleIcon moduleId={module.id} /></div>
                  <div className="module-meta"><h3>{module.title}</h3><p>{module.desc}</p></div>
                </div>
                <span className="arrow-indicator" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : <div className="empty-state"><strong>No modules found</strong><p>Try a different search term.</p></div>}
      </section>
    </div>
  );
}

function BackToDashboard() {
  return <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>;
}

function ModuleDetailPage({ user }) {
  const { moduleId } = useParams();
  const module = getModuleById(moduleId);
  const [activeTab, setActiveTab] = useState('analysis');
  const [input, setInput] = useState('');
  const [proteinSequence, setProteinSequence] = useState('');
  const [ligandSmiles, setLigandSmiles] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!module) return <Navigate to="/dashboard" replace />;

  const setExample = (example) => {
    if (module.id === 'docking') {
      setProteinSequence(example.proteinSequence);
      setLigandSmiles(example.ligandSmiles);
      setError('');
      return;
    }
    setInput(typeof example === 'string' ? example : example.value);
    setError('');
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    if (file.size > 5 * 1024 * 1024) {
      setError('File is larger than 5 MB. Choose a smaller input file.');
      event.target.value = '';
      return;
    }
    try {
      const contents = await file.text();
      if (module.id === 'docking') setProteinSequence(contents);
      else setInput(contents);
      setFileName(file.name);
    } catch (fileError) {
      console.error('Could not read the selected analysis file.', fileError);
      setError('The selected file could not be read. Try a plain-text FASTA or SMILES file.');
    }
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setError('');
    setResponse(null);
    const query = input.trim();
    if (module.id === 'docking') {
      if (!proteinSequence.trim() || !ligandSmiles.trim()) {
        setError('Enter both a protein sequence and a ligand SMILES string.');
        return;
      }
    } else if (!query) {
      setError('Please enter a valid input before running analysis.');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (module.id === 'protein') {
        result = await api.post('/api/analyze-protein', { input_data: query });
      } else if (module.id === 'structure') {
        result = await api.get(`/api/protein-structure/${encodeURIComponent(query)}`);
      } else if (module.id === 'phylogeny') {
        result = await api.post('/api/phylogenetic-analysis-dynamic', { fasta_sequences: query });
      } else if (module.id === 'molecule') {
        result = await api.post('/api/analyze-molecule', { smiles: query });
      } else if (module.id === 'gene') {
        result = await api.post('/api/analyze-gene', { gene_symbol: query });
      } else if (module.id === 'docking') {
        result = await api.post('/api/dynamic-docking-simulation', {
          protein_sequence: proteinSequence.trim(),
          smiles: ligandSmiles.trim(),
        });
      } else {
        result = await api.post('/api/agent-chat', { message: query });
      }

      setResponse(module.id === 'agent' ? (result.data.response || result.data) : result.data);
      saveHistory(user.email, module.id);
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : requestError.message || 'Analysis execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const examples = moduleExamples[module.id] || [];
  const inputConfig = moduleInputs[module.id];

  return (
    <div className="module-detail-page">
      <BackToDashboard />
      <div className="module-header-card">
        <div className="module-header-main">
          <div className="module-icon-box large" style={{ background: module.accent, color: module.accentStrong }}><ModuleIcon moduleId={module.id} /></div>
          <div><h2>{module.title}</h2><p>{module.desc}. Connect to authoritative scientific tools from one workspace.</p></div>
        </div>
        <span className="status-badge">● Ready</span>
      </div>

      <div className="module-tabs" role="tablist" aria-label={`${module.title} sections`}>
        <button type="button" role="tab" aria-selected={activeTab === 'analysis'} className={activeTab === 'analysis' ? 'tab active' : 'tab'} onClick={() => setActiveTab('analysis')}>Analysis</button>
        <button type="button" role="tab" aria-selected={activeTab === 'history'} className={activeTab === 'history' ? 'tab active' : 'tab'} onClick={() => setActiveTab('history')}>History</button>
        <button type="button" role="tab" aria-selected={activeTab === 'documentation'} className={activeTab === 'documentation' ? 'tab active' : 'tab'} onClick={() => setActiveTab('documentation')}>Documentation</button>
      </div>

      {activeTab === 'analysis' && (
        <>
          <form onSubmit={handleAnalyze} className="analysis-panel">
            {module.id === 'docking' ? (
              <div className="docking-input-grid">
                <label className="field-group"><span>Protein sequence</span><textarea value={proteinSequence} onChange={(event) => setProteinSequence(event.target.value)} className="sequence-textarea" placeholder="Paste the protein amino-acid sequence..." disabled={loading} /></label>
                <label className="field-group"><span>Ligand SMILES</span><textarea value={ligandSmiles} onChange={(event) => setLigandSmiles(event.target.value)} className="sequence-textarea compact-textarea" placeholder="Enter ligand SMILES (e.g. CCO)..." disabled={loading} /></label>
              </div>
            ) : (
              <>
                <div className="analysis-toolbar"><span>{inputConfig.label}</span><span className="format-hint">{module.id === 'phylogeny' ? 'FASTA' : module.id === 'molecule' ? 'SMILES' : 'Scientific input'}</span></div>
                <textarea value={input} onChange={(event) => setInput(event.target.value)} className="sequence-textarea" placeholder={inputConfig.placeholder} disabled={loading} />
              </>
            )}
            <div className="upload-row">
              <span>{module.id === 'docking' ? 'Or upload a protein sequence' : 'Or upload an input file'}</span>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept=".fasta,.fa,.fna,.txt,.smi,.smiles,.csv" onChange={handleFile} />
              <button type="button" className="choose-file-btn" onClick={() => fileInputRef.current?.click()} disabled={loading}>Choose File</button>
              <span className="file-status">{fileName || 'No file chosen'}</span>
            </div>
            {error && <div className="form-alert error" role="alert">{error}</div>}
            <button type="submit" className="primary-action" disabled={loading}><span aria-hidden="true">▶</span>{loading ? 'Running analysis…' : 'Run Analysis'}</button>
          </form>
          <div className="quick-examples-box">
            <span className="input-label">💡 Quick Examples</span>
            <div className="examples-row">{examples.map((example) => {
              const label = typeof example === 'string' ? example : example.label;
              return <button key={label} type="button" className="example-chip" onClick={() => setExample(example)}>{label}</button>;
            })}</div>
          </div>
          {response && <div className="analysis-panel result-panel"><div className="result-heading"><div><span className="section-eyebrow">COMPLETED</span><h3>Execution Results</h3></div><span className="status-badge">Success</span></div><pre>{JSON.stringify(response, null, 2)}</pre></div>}
          <div className="feature-metrics">{(moduleHighlights[module.id] || []).map(([icon, title, description]) => <div className="metric-box" key={title}><div className="metric-icon">{icon}</div><h4>{title}</h4><p>{description}</p></div>)}</div>
        </>
      )}
      {activeTab === 'history' && <div className="analysis-panel"><h3>Recent analysis runs</h3><AnalysisHistory records={readHistory(user.email).filter((record) => record.moduleId === module.id)} /></div>}
      {activeTab === 'documentation' && (
        <div className="analysis-panel documentation-panel">
          <span className="section-eyebrow">MODULE GUIDE</span>
          <h3>{module.title}</h3>
          <p>{module.desc}. Enter the required input and run the analysis to request results from the connected Aletheia Bio research backend.</p>
          <ul><li>Use an accession or sequence format appropriate to this module.</li><li>Use the Quick Examples to prefill a supported sample.</li><li>Results and errors are returned by the connected backend.</li></ul>
        </div>
      )}
    </div>
  );
}

function AnalysisHistory({ records, onClear }) {
  if (records.length === 0) return <div className="empty-state"><strong>No completed analyses yet</strong><p>Successful module runs will appear here. Input sequences and results are not stored in browser history.</p></div>;
  return (
    <div className="history-list">
      {records.map((record) => (
        <div className="history-row" key={record.id}>
          <div className="history-icon"><ModuleIcon moduleId={record.moduleId} /></div>
          <div className="history-copy"><strong>{getModuleById(record.moduleId)?.title || 'Research module'}</strong><span>{new Date(record.createdAt).toLocaleString()}</span></div>
          <span className="status-badge">{record.status}</span>
        </div>
      ))}
      {onClear && <button type="button" className="secondary-button" onClick={onClear}>Clear history</button>}
    </div>
  );
}

function HistoryPage({ user, history }) {
  const navigate = useNavigate();
  const clearHistory = () => {
    if (!window.confirm('Clear saved analysis history for this account on this browser?')) return;
    localStorage.removeItem(getHistoryKey(user.email));
    navigate('/history', { replace: true, state: { historyCleared: true } });
  };

  return (
    <section className="utility-page">
      <BackToDashboard />
      <div className="utility-heading"><span className="section-eyebrow">WORKSPACE</span><h1>Analysis History</h1><p>Review successful research runs from this browser.</p></div>
      <div className="analysis-panel"><AnalysisHistory records={history} onClear={history.length > 0 ? clearHistory : null} /></div>
      <p className="privacy-note">For privacy, analysis inputs and result data are not stored in browser history.</p>
    </section>
  );
}

function getPreferences(email) {
  try {
    return JSON.parse(localStorage.getItem(`aletheia-preferences:${email}`) || '{"notifications":true}');
  } catch (error) {
    console.error('Could not read saved workspace preferences.', error);
    return { notifications: true };
  }
}

function SettingsPage({ user, onUserUpdated }) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [notifications, setNotifications] = useState(() => getPreferences(user.email).notifications !== false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    setError('');
    try {
      const response = await api.patch('/api/auth/profile', { display_name: displayName.trim() });
      const preferences = { ...getPreferences(user.email), notifications };
      localStorage.setItem(`aletheia-preferences:${user.email}`, JSON.stringify(preferences));
      onUserUpdated(response.data);
      setStatus('Your profile and preferences have been saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to save settings. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="utility-page">
      <BackToDashboard />
      <div className="utility-heading"><span className="section-eyebrow">PREFERENCES</span><h1>Settings</h1><p>Manage your profile and workspace preferences.</p></div>
      {error && <div className="form-alert error" role="alert">{error}</div>}
      {status && <div className="form-alert success" role="status">{status}</div>}
      <form className="settings-grid" onSubmit={saveSettings}>
        <section className="analysis-panel settings-card">
          <h2>Profile</h2>
          <p className="settings-description">Your account identity and workspace display name.</p>
          <label className="field-group"><span>Display name</span><div className="input-shell"><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} maxLength={80} /></div></label>
          <label className="field-group"><span>Email address</span><div className="input-shell"><input type="email" value={user.email} readOnly /></div></label>
          <p className="privacy-note">Email address is your unique account identifier and cannot be changed here.</p>
        </section>
        <section className="analysis-panel settings-card">
          <h2>Workspace preferences</h2>
          <p className="settings-description">Choose which in-app updates to show.</p>
          <label className="preference-row"><span><strong>Analysis notifications</strong><small>Show in-app updates when you finish an analysis.</small></span><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /></label>
        </section>
        <button type="submit" className="primary-action settings-submit" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
      </form>
    </section>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()));
  const [authNotice, setAuthNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      return undefined;
    }
    api.get('/api/auth/me')
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          clearToken();
        } else {
          console.error('Unable to verify the saved sign-in session.', error);
          setAuthNotice('Could not verify your saved session. Sign in again when the backend is available.');
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const expireSession = () => {
      clearToken();
      setUser(null);
      setAuthNotice('Your session expired. Please sign in again.');
      navigate('/', { replace: true });
    };
    window.addEventListener('aletheia:session-expired', expireSession);
    return () => window.removeEventListener('aletheia:session-expired', expireSession);
  }, [navigate]);

  const handleAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthNotice('');
    setSearchQuery('');
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('The server could not revoke the session; clearing the local sign-in state.', error);
    } finally {
      clearToken();
      setUser(null);
      setAuthNotice('');
      setSearchQuery('');
      navigate('/', { replace: true });
    }
  };

  if (authLoading) return <div className="app-loading" role="status">Verifying your session…</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onAuthenticated={handleAuthenticated} notice={authNotice} />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage onAuthenticated={handleAuthenticated} />} />
      <Route path="/dashboard" element={user ? <DashboardLayout user={user} onLogout={handleLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery}><DashboardPage searchQuery={searchQuery} /></DashboardLayout> : <Navigate to="/" replace />} />
      <Route path="/module/:moduleId" element={user ? <DashboardLayout user={user} onLogout={handleLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery}><ModuleDetailPage key={location.pathname} user={user} /></DashboardLayout> : <Navigate to="/" replace />} />
      <Route path="/history" element={user ? <DashboardLayout user={user} onLogout={handleLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery}>{(history) => <HistoryPage user={user} history={history} />}</DashboardLayout> : <Navigate to="/" replace />} />
      <Route path="/settings" element={user ? <DashboardLayout user={user} onLogout={handleLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery}><SettingsPage user={user} onUserUpdated={setUser} /></DashboardLayout> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
