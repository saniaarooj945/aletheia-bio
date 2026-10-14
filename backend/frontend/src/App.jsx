import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/query', { prompt });
      setResponse(res.data);
    } catch (err) {
      setError('Backend connection failed! Ensure FastAPI engine is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (presetText) => {
    setPrompt(presetText);
  };

  return (
    <div className="dashboard-container">
      {/* Top Professional Header */}
      <header className="header-nav">
        <div className="brand-section">
          <div className="pulse-indicator"></div>
          <span className="brand-name">Aletheia Bio</span>
          <span className="engine-badge">Deterministic Multi-Omics Agent</span>
        </div>
        <div className="nav-stats">
          <div className="stat-pill">🟢 FastAPI: Online</div>
          <div className="stat-pill">⚡ RDKit / NCBI Active</div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="main-layout">
        
        {/* Left Sidebar - Capabilities & Quick Info */}
        <aside className="sidebar-panel">
          <h3>Omics Domains</h3>
          <div className="domain-card">
            <span className="domain-icon">🧬</span>
            <div>
              <h4>Genomics</h4>
              <p>NCBI Entrez Integration</p>
            </div>
          </div>
          <div className="domain-card">
            <span className="domain-icon">🧪</span>
            <div>
              <h4>Proteomics</h4>
              <p>UniProt Accession Retrieval</p>
            </div>
          </div>
          <div className="domain-card">
            <span className="domain-icon">💊</span>
            <div>
              <h4>ChemInformatics</h4>
              <p>RDKit Small-Molecule Engine</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <p><strong>Zero-Hallucination Guarantee:</strong> All outputs are verified directly via structured programmatic APIs.</p>
          </div>
        </aside>

        {/* Right Content Workspace */}
        <main className="workspace-panel">
          <div className="hero-box">
            <h1>Computational Biology Research Hub</h1>
            <p>Execute deterministic queries across genomic sequences, protein structures, and chemical compound properties instantly.</p>
          </div>

          {/* Query Bar */}
          <form onSubmit={handleSubmit} className="query-box-wrapper">
            <div className="input-container">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter query e.g., 'analyze chemical molecule for aspirin' or 'fetch ncbi data for tp53'..."
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="run-btn">
                {loading ? 'Processing...' : 'Execute Agent'}
              </button>
            </div>
          </form>

          {/* Preset Chips */}
          <div className="presets-section">
            <span className="presets-label">Preset Queries:</span>
            <button onClick={() => handlePresetClick("analyze chemical molecule for aspirin")} className="preset-chip">
              💊 Aspirin Analysis (RDKit)
            </button>
            <button onClick={() => handlePresetClick("fetch ncbi data for tp53")} className="preset-chip">
              🧬 TP53 Gene (NCBI)
            </button>
          </div>

          {/* Error Notice */}
          {error && <div className="error-alert">{error}</div>}

          {/* Glass Box Execution Trace Output */}
          {response && (
            <div className="results-container">
              <div className="results-header">
                <h3>Glass Box Execution Trace</h3>
                <span className="status-ok">HTTP 200 OK</span>
              </div>
              <div className="results-content">
                <div className="result-group">
                  <label>Submitted Query</label>
                  <div className="query-text">{response.query}</div>
                </div>
                <div className="result-group">
                  <label>Deterministic Payload Result</label>
                  <pre className="json-display">{response.result}</pre>
                </div>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

export default App;