import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as $3Dmol from '3dmol';
import './App.css';

// Component to draw dynamic phylogenetic tree on Canvas
const TreeVisualizer = ({ newickStr, taxa }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !taxa || taxa.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#087F8C';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#15365B';
    ctx.font = '13px sans-serif';

    const startX = 40;
    const startY = 40;
    const stepY = (canvas.height - 80) / Math.max(taxa.length - 1, 1);
    const endX = canvas.width - 180;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, startY + (taxa.length - 1) * stepY);
    ctx.stroke();

    taxa.forEach((taxon, index) => {
      const y = startY + index * stepY;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endX, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#16A34A';
      ctx.fill();

      ctx.fillStyle = '#15365B';
      ctx.fillText(`🌿 ${taxon}`, endX + 10, y + 4);
    });
  }, [newickStr, taxa]);

  return (
    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #DCE5ED', marginBottom: '16px' }}>
      <h4 style={{ color: '#087F8C', marginTop: 0, fontSize: '14px' }}>🌳 Rendered Graphical Phylogenetic Tree</h4>
      <canvas ref={canvasRef} width={600} height={220} style={{ width: '100%', height: 'auto' }} />
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('protein');
  const [inputData, setInputData] = useState('');
  const [dockingSeq, setDockingSeq] = useState('');
  const [dockingSmiles, setDockingSmiles] = useState('');
  const [fastaInput, setFastaInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const viewerRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'structure' && response && response.pdb_url && viewerRef.current) {
      viewerRef.current.innerHTML = '';
      const viewer = $3Dmol.createViewer(viewerRef.current, {
        backgroundColor: 'black',
        width: viewerRef.current.clientWidth || 600,
        height: 380
      });
      
      fetch(response.pdb_url)
        .then((res) => res.text())
        .then((pdbText) => {
          viewer.addModel(pdbText, 'pdb');
          viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
          viewer.zoomTo();
          viewer.render();
        })
        .catch((err) => console.error("PDB load error:", err));
    }
  }, [response, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (activeTab !== 'agent') {
      setResponse(null);
    }

    try {
      if (activeTab === 'protein') {
        const res = await axios.post('http://127.0.0.1:8000/api/analyze-protein', { input_data: inputData });
        setResponse(res.data);
      } else if (activeTab === 'structure') {
        const res = await axios.get(`http://127.0.0.1:8000/api/protein-structure/${inputData.trim()}`);
        setResponse(res.data);
      } else if (activeTab === 'phylogeny') {
        const res = await axios.post('http://127.0.0.1:8000/api/phylogenetic-analysis-dynamic', { fasta_sequences: fastaInput });
        setResponse(res.data);
      } else if (activeTab === 'molecule') {
        const res = await axios.post('http://127.0.0.1:8000/api/analyze-molecule', { smiles: inputData });
        setResponse(res.data);
      } else if (activeTab === 'gene') {
        const res = await axios.post('http://127.0.0.1:8000/api/analyze-gene', { gene_symbol: inputData });
        setResponse(res.data);
      } else if (activeTab === 'docking') {
        const res = await axios.post('http://127.0.0.1:8000/api/dynamic-docking-simulation', { protein_sequence: dockingSeq, smiles: dockingSmiles });
        setResponse(res.data);
      } else if (activeTab === 'agent') {
        const userMsg = inputData;
        if (!userMsg.trim()) return;
        setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
        setInputData('');
        
        const res = await axios.post('http://127.0.0.1:8000/api/agent-chat', { message: userMsg });
        setChatMessages((prev) => [
          ...prev, 
          { sender: 'agent', data: res.data.response }
        ]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    const downloadData = activeTab === 'agent' ? chatMessages : response;
    if (!downloadData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(downloadData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aletheia_bio_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="dashboard-container">
      {/* A. Top Navigation Bar */}
      <header className="header-nav">
        <div className="brand-section">
          <svg className="dna-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 15c6.667-6 13.333 0 20-6M2 9c6.667 6 13.333 0 20 6" />
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="brand-name">Aletheia Bio</span>
          <span className="brand-divider">|</span>
          <span className="brand-subtitle">Enterprise Multi-Omics Agent</span>
        </div>

        <div className="nav-stats">
          <div className="system-online-badge">
            <div className="green-dot"></div>
            System Online
          </div>
          
          <button className="nav-icon-btn" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-dot"></span>
          </button>

          <div className="user-profile-avatar">
            <div className="avatar-badge">SA</div>
            <span className="user-name">Sania Arooj ▾</span>
          </div>
        </div>
      </header>

      {/* Main Layout Split */}
      <div className="main-layout">
        {/* B. Left Sidebar Domain Selection */}
        <aside className="sidebar-panel">
          <div className="sidebar-title">Domain Selection</div>
          
          <div className="sidebar-menu">
            <button 
              onClick={() => { setActiveTab('protein'); setInputData(''); setResponse(null); }} 
              className={`module-card-btn ${activeTab === 'protein' ? 'active' : ''}`}
            >
              <div className="module-card-content">
                <div className="module-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>
                    <path d="M8.5 8.5l7 7M12 6v12"/>
                  </svg>
                </div>
                <div className="module-text-wrapper">
                  <h4>Proteomics Engine</h4>
                  <p>UniProt & Biophysical Metrics</p>
                </div>
              </div>
              <span className="chevron-icon">›</span>
            </button>

            <button 
              onClick={() => { setActiveTab('structure'); setInputData(''); setResponse(null); }} 
              className={`module-card-btn ${activeTab === 'structure' ? 'active' : ''}`}
            >
              <div className="module-card-content">
                <div className="module-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>
                <div className="module-text-wrapper">
                  <h4>3D Structure Viewer</h4>
                  <p>Interactive 3D/MD Rendering</p>
                </div>
              </div>
              <span className="chevron-icon">›</span>
            </button>

            <button 
              onClick={() => { setActiveTab('phylogeny'); setResponse(null); }} 
              className={`module-card-btn ${activeTab === 'phylogeny' ? 'active' : ''}`}
            >
              <div className="module-card-content">
                <div className="module-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M12 18H6M12 10h8M6 18H2M20 10h2"/>
                  </svg>
                </div>
                <div className="module-text-wrapper">
                  <h4>Dynamic Phylogenetics Tree</h4>
                  <p>FASTA Alignment & Graphical Tree</p>
                </div>
              </div>
              <span className="chevron-icon">›</span>
            </button>

            <button 
              onClick={() => { setActiveTab('molecule'); setInputData(''); setResponse(null); }} 
              className={`module-card-btn ${activeTab === 'molecule' ? 'active' : ''}`}
            >
              <div className="module-card-content">
                <div className="module-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 2v7.5M14 2v7.5M8.5 13a4.5 4.5 0 1 0 7 0H8.5z"/>
                  </svg>
                </div>
                <div className="module-text-wrapper">
                  <h4>ChemInformatics (RDKit)</h4>
                  <p>Small-Molecule Drug Analysis</p>
                </div>
              </div>
              <span className="chevron-icon">›</span>
            </button>

            <button 
              onClick={() => { setActiveTab('gene'); setInputData(''); setResponse(null); }} 
              className={`module-card-btn ${activeTab === 'gene' ? 'active' : ''}`}
            >
              <div className="module-card-content">
                <div className="module-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 15c6.667-6 13.333 0 20-6M2 9c6.667 6 13.333 0 20 6"/>
                  </svg>
                </div>
                <div className="module-text-wrapper">
                  <h4>Genomics (NCBI)</h4>
                  <p>Gene & Nucleotide Search</p>
                </div>
              </div>
              <span className="chevron-icon">›</span>
            </button>

            <button 
              onClick={() => { setActiveTab('docking'); setResponse(null); }} 
              className={`module-card-btn ${activeTab === 'docking' ? 'active' : ''}`}
            >
              <div className="module-card-content">
                <div className="module-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>
                  </svg>
                </div>
                <div className="module-text-wrapper">
                  <h4>CADD & Docking Studio</h4>
                  <p>Dynamic Protein-Ligand Simulation</p>
                </div>
              </div>
              <span className="chevron-icon">›</span>
            </button>

            <button 
              onClick={() => { setActiveTab('agent'); setInputData(''); }} 
              className={`module-card-btn ${activeTab === 'agent' ? 'active' : ''}`}
            >
              <div className="module-card-content">
                <div className="module-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
                  </svg>
                </div>
                <div className="module-text-wrapper">
                  <h4>AI Agent View</h4>
                  <p>Natural Language Router</p>
                </div>
              </div>
              <span className="chevron-icon">›</span>
            </button>
          </div>
        </aside>

        {/* C. Main Content Workspace Card */}
        <main className="workspace-panel">
          <div className="workspace-card">
            
            {/* Header Control Bar */}
            <div className="workspace-header-bar">
              <button className="back-badge-btn" onClick={() => setActiveTab('protein')}>
                ← {activeTab.toUpperCase()} Module
              </button>
              
              <div className="workspace-status-controls">
                <span className="api-online-pill">
                  <span className="green-dot"></span> API Online
                </span>
                <a href="#help" className="help-docs-btn" onClick={(e) => e.preventDefault()}>
                  Help & Docs ↗
                </a>
              </div>
            </div>

            {/* Hero Section Title */}
            <div className="hero-title-section">
              <div className="module-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>
                  <path d="M8.5 8.5l7 7M12 6v12"/>
                </svg>
              </div>
              <div>
                <h1>
                  {activeTab === 'protein' && 'Protein Sequence Engine'}
                  {activeTab === 'structure' && '3D Structure Prediction & Viewer'}
                  {activeTab === 'phylogeny' && 'Dynamic Phylogenetics Alignment & Tree Viewer'}
                  {activeTab === 'molecule' && 'Small-Molecule Drug Design Studio'}
                  {activeTab === 'gene' && 'Genomics Research Hub'}
                  {activeTab === 'docking' && 'Dynamic CADD & Molecular Docking Studio'}
                  {activeTab === 'agent' && 'Unified Conversational AI Agent'}
                </h1>
                <p>
                  {activeTab === 'protein' && 'Enter UniProt ID (e.g. P68871) or sequence to analyze protein properties, structure and functional insights.'}
                  {activeTab === 'structure' && 'Enter UniProt ID for AlphaFold 3D model & 3Dmol rendering.'}
                  {activeTab === 'phylogeny' && 'Enter Multi-FASTA sequences to dynamically compute distance matrix & draw graphical tree.'}
                  {activeTab === 'molecule' && 'Enter SMILES string (e.g., CC(=O)OC1=CC=CC=C1C(=O)O) for RDKit analysis.'}
                  {activeTab === 'gene' && 'Enter gene symbol (e.g., TP53, BRCA1) for NCBI metadata.'}
                  {activeTab === 'docking' && 'Input custom protein sequence and ligand SMILES for simulation.'}
                  {activeTab === 'agent' && 'Ask any natural language multi-omics question.'}
                </p>
              </div>
            </div>

            {/* Input Form Section */}
            {activeTab === 'phylogeny' ? (
              <form onSubmit={handleSubmit} className="analysis-card-wrapper">
                <textarea
                  rows={4}
                  value={fastaInput}
                  onChange={(e) => setFastaInput(e.target.value)}
                  placeholder={">Isoform_A\nMKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAT\n>Isoform_B\nMKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPIL"}
                  disabled={loading}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'monospace' }}
                />
                <button type="submit" disabled={loading} className="run-analysis-btn" style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}>
                  {loading ? 'Building Tree...' : 'Build Dynamic Phylogenetic Tree'}
                </button>
              </form>
            ) : activeTab === 'docking' ? (
              <form onSubmit={handleSubmit} className="analysis-card-wrapper">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={dockingSeq}
                    onChange={(e) => setDockingSeq(e.target.value)}
                    placeholder="Enter Protein Amino Acid Sequence..."
                    disabled={loading}
                    rows={2}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'monospace' }}
                  />
                  <div className="search-input-group">
                    <input
                      type="text"
                      value={dockingSmiles}
                      onChange={(e) => setDockingSmiles(e.target.value)}
                      placeholder="Enter Ligand SMILES..."
                      disabled={loading}
                    />
                    <button type="submit" disabled={loading} className="run-analysis-btn">
                      {loading ? 'Simulating...' : 'Run Docking'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="analysis-card-wrapper">
                <div className="search-input-group">
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder={
                      activeTab === 'agent' ? "Ask any multi-omics question (e.g., Analyze protein P68871)..." :
                      activeTab === 'structure' || activeTab === 'protein' ? "e.g. P68871 or paste protein sequence..." :
                      activeTab === 'molecule' ? "e.g. CC(=O)OC1=CC=CC=C1C(=O)O" :
                      "e.g. TP53"
                    }
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading} className="run-analysis-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    {loading ? 'Processing...' : activeTab === 'agent' ? 'Send Query' : 'Run Analysis'}
                  </button>
                </div>
              </form>
            )}

            {/* Presets Selector */}
            <div className="presets-section">
              <span className="presets-label">Preset:</span>
              {activeTab === 'agent' && (
                <button type="button" onClick={() => setInputData("Analyze structure and docking for protein P68871")} className="preset-chip">🔗 Sample Agent Query ▾</button>
              )}
              {activeTab === 'docking' && (
                <button 
                  type="button" 
                  onClick={() => { 
                    setDockingSeq("MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAT"); 
                    setDockingSmiles("CC(=O)OC1=CC=CC=C1C(=O)O"); 
                  }} 
                  className="preset-chip"
                >
                  🔗 Ecotin + Aspirin Complex ▾
                </button>
              )}
              {activeTab === 'phylogeny' && (
                <button type="button" onClick={() => setFastaInput(">Isoform_A\nMKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAT\n>Isoform_B\nMKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPIL\n>Isoform_C\nMKTAYIAKQRQISFVKSHFSRQ")} className="preset-chip">🔗 FASTA Test Sequences ▾</button>
              )}
              {activeTab === 'structure' && (
                <button type="button" onClick={() => setInputData("P68871")} className="preset-chip">🔗 Hemoglobin (P68871) ▾</button>
              )}
              {activeTab === 'protein' && (
                <button type="button" onClick={() => setInputData("P68871")} className="preset-chip">🔗 Hemoglobin (P68871) ▾</button>
              )}
              {activeTab === 'molecule' && (
                <button type="button" onClick={() => setInputData("CC(=O)OC1=CC=CC=C1C(=O)O")} className="preset-chip">🔗 Aspirin ▾</button>
              )}
              {activeTab === 'gene' && (
                <button type="button" onClick={() => setInputData("TP53")} className="preset-chip">🔗 TP53 Gene ▾</button>
              )}
            </div>

            {error && <div className="error-alert">{error}</div>}

            {/* FIRST: RESULTS TRACE (Renders on top when a query is submitted) */}
            {activeTab === 'agent' ? (
              chatMessages.length > 0 && (
                <div className="results-container" style={{ marginBottom: '24px' }}>
                  <div className="results-header">
                    <h3>Agent Conversation Trace</h3>
                    <button onClick={handleDownloadReport} className="download-report-btn">📥 Download Report</button>
                  </div>
                  <div className="results-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {chatMessages.map((msg, index) => (
                      <div key={index} style={{ background: msg.sender === 'user' ? '#F8FAFC' : '#E4F5F4', padding: '12px', borderRadius: '8px', borderLeft: msg.sender === 'user' ? '4px solid #15365B' : '4px solid #087F8C' }}>
                        <strong>{msg.sender === 'user' ? '👤 User Query:' : '🤖 Agent Response:'}</strong>
                        {msg.sender === 'user' ? <p style={{ margin: '4px 0 0 0' }}>{msg.text}</p> : <pre className="json-display" style={{ marginTop: '8px' }}>{JSON.stringify(msg.data.result, null, 2)}</pre>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              response && (
                <div className="results-container" style={{ marginBottom: '24px' }}>
                  <div className="results-header">
                    <h3>Glass Box Execution Trace</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="status-ok">HTTP 200 OK</span>
                      <button onClick={handleDownloadReport} className="download-report-btn">📥 Download Report</button>
                    </div>
                  </div>
                  <div className="results-content">
                    {activeTab === 'phylogeny' && (
                      <>
                        <TreeVisualizer newickStr={response.newick_tree} taxa={response.taxa_names} />
                        <div className="result-group">
                          <label>Newick Format Tree String</label>
                          <pre className="json-display">{response.newick_tree}</pre>
                        </div>
                      </>
                    )}
                    {activeTab === 'structure' && (
                      <>
                        <div className="result-group">
                          <label>Interactive 3D Structure Viewer (3Dmol.js)</label>
                          <div 
                            ref={viewerRef} 
                            style={{ 
                              width: '100%', 
                              height: '380px', 
                              position: 'relative', 
                              background: '#000', 
                              borderRadius: '10px', 
                              border: '1px solid #DCE5ED', 
                              marginBottom: '15px',
                              overflow: 'hidden'
                            }}
                          ></div>
                          <div style={{ fontSize: '13px', color: '#15365B' }}>
                            <strong>UniProt ID:</strong> {response.uniprot_id} | <strong>pLDDT Confidence:</strong> {response.plddt_confidence_score} <br />
                            <a href={response.pdb_url} target="_blank" rel="noreferrer" style={{ color: '#087F8C', textDecoration: 'underline' }}>📥 Download PDB File</a>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="result-group">
                      <label>Analysis Payload</label>
                      <pre className="json-display">{JSON.stringify(response, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* SECOND: HERO SHOWCASE CARDS (Renders below the results) */}
            {activeTab === 'protein' && (
              <div className="hero-banner-card">
                <div className="hero-banner-content">
                  <div className="hero-tag">— FROM SEQUENCES TO INSIGHTS</div>
                  <h2>Explore Protein Biology with AI-Powered Analysis</h2>
                  <p>Get comprehensive insights into protein function, structure, domains and properties — all in one place.</p>
                  
                  <div className="hero-indicators-grid">
                    <div className="feature-indicator-item">
                      <div className="feature-indicator-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>
                      <span>Sequence Analysis</span>
                    </div>
                    <div className="feature-indicator-item">
                      <div className="feature-indicator-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.5 8.5l7 7"/></svg></div>
                      <span>Structural Insights</span>
                    </div>
                    <div className="feature-indicator-item">
                      <div className="feature-indicator-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>
                      <span>Functional Annotation</span>
                    </div>
                    <div className="feature-indicator-item">
                      <div className="feature-indicator-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                      <span>Detailed Reports</span>
                    </div>
                  </div>
                </div>
                <div className="hero-banner-graphic">
                  <svg width="220" height="180" viewBox="0 0 200 160" fill="none">
                    <path d="M 30 80 Q 60 20, 90 80 T 150 80" stroke="#087F8C" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.85"/>
                    <path d="M 40 90 Q 70 30, 100 90 T 160 90" stroke="#15365B" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.75"/>
                    <circle cx="90" cy="80" r="6" fill="#16A34A" />
                    <text x="100" y="75" fontSize="10" fill="#15365B" fontWeight="bold">UniProt ID</text>
                    <text x="100" y="88" fontSize="9" fill="#087F8C">P68871</text>
                  </svg>
                </div>
              </div>
            )}

            {activeTab === 'structure' && (
              <div className="hero-banner-card">
                <div className="hero-banner-content">
                  <div className="hero-tag">— HIGH RESOLUTION TERTIARY FOLDS</div>
                  <h2>AlphaFold 3D Structural Modeling & Validation</h2>
                  <p>Visualize secondary helix/sheet composition, Ramachandran validation maps, and pLDDT local confidence metrics.</p>
                  
                  <div className="hero-indicators-grid">
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🧊</div><span>pLDDT Confidence</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🌀</div><span>Alpha-Helices %</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">📐</div><span>Beta-Sheets %</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🎯</div><span>Ramachandran Stats</span></div>
                  </div>
                </div>
                <div className="hero-banner-graphic">
                  <svg width="200" height="160" viewBox="0 0 200 160">
                    <path d="M 20 20 L 180 20 L 180 140 L 20 140 Z" fill="#087F8C" opacity="0.1" stroke="#087F8C" strokeWidth="2" />
                    <circle cx="100" cy="80" r="45" fill="none" stroke="#15365B" strokeWidth="4" strokeDasharray="5,5" />
                    <path d="M 70 80 Q 100 40, 130 80 T 160 80" stroke="#16A34A" strokeWidth="6" fill="none" />
                  </svg>
                </div>
              </div>
            )}

            {activeTab === 'phylogeny' && (
              <div className="hero-banner-card">
                <div className="hero-banner-content">
                  <div className="hero-tag">— CLADISTIC EVOLUTIONARY LINEAGE</div>
                  <h2>Dynamic Clustal Alignment & Phylogram Generation</h2>
                  <p>Align multi-FASTA protein/nucleotide isolates, compute distance matrices, and plot Newick phylogenetic trees.</p>
                  
                  <div className="hero-indicators-grid">
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🌳</div><span>Neighbor-Joining</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">📊</div><span>Distance Matrix</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🌿</div><span>Clade Divergence</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🧬</div><span>FASTA Align</span></div>
                  </div>
                </div>
                <div className="hero-banner-graphic">
                  <svg width="200" height="160" viewBox="0 0 200 160">
                    <path d="M 30 30 L 30 130 M 30 50 L 120 50 M 30 110 L 120 110 M 120 110 L 170 90 M 120 110 L 170 130" stroke="#087F8C" strokeWidth="4" strokeLinecap="round" fill="none"/>
                    <circle cx="170" cy="90" r="5" fill="#16A34A"/>
                    <circle cx="170" cy="130" r="5" fill="#16A34A"/>
                    <circle cx="120" cy="50" r="5" fill="#15365B"/>
                  </svg>
                </div>
              </div>
            )}

            {activeTab === 'molecule' && (
              <div className="hero-banner-card">
                <div className="hero-banner-content">
                  <div className="hero-tag">— CHEMINFORMATICS & DRUG LIKENESS</div>
                  <h2>RDKit Small-Molecule Descriptor Screening</h2>
                  <p>Compute Lipinski's Rule of 5 violations, topological polar surface area (TPSA), LogP, and hydrogen bond capacity.</p>
                  
                  <div className="hero-indicators-grid">
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">💊</div><span>Lipinski Rule of 5</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">⚖️</div><span>Molecular Weight</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">💧</div><span>LogP Hydrophobicity</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🔗</div><span>H-Bond Donors/Acc</span></div>
                  </div>
                </div>
                <div className="hero-banner-graphic">
                  <svg width="200" height="160" viewBox="0 0 200 160">
                    <polygon points="100,30 140,55 140,105 100,130 60,105 60,55" fill="none" stroke="#087F8C" strokeWidth="4"/>
                    <circle cx="100" cy="30" r="8" fill="#15365B"/>
                    <circle cx="140" cy="55" r="8" fill="#16A34A"/>
                    <circle cx="60" cy="105" r="8" fill="#087F8C"/>
                  </svg>
                </div>
              </div>
            )}

            {activeTab === 'gene' && (
              <div className="hero-banner-card">
                <div className="hero-banner-content">
                  <div className="hero-tag">— GENOMIC INTEGRATION & ANNOTATION</div>
                  <h2>NCBI Entrez Query & Chromosomal Locus Mapping</h2>
                  <p>Query Entrez databases live for human/pathogen genomic locus summaries, chromosomal positioning, and transcript IDs.</p>
                  
                  <div className="hero-indicators-grid">
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🔬</div><span>NCBI Gene Search</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">📍</div><span>Locus Tagging</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🧬</div><span>Genomic Sequence</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">📑</div><span>RefSeq Metadata</span></div>
                  </div>
                </div>
                <div className="hero-banner-graphic">
                  <svg width="200" height="160" viewBox="0 0 200 160">
                    <path d="M 50 20 C 150 50, 50 110, 150 140" stroke="#087F8C" strokeWidth="6" fill="none"/>
                    <path d="M 150 20 C 50 50, 150 110, 50 140" stroke="#15365B" strokeWidth="6" fill="none"/>
                    <line x1="75" y1="42" x2="125" y2="42" stroke="#16A34A" strokeWidth="3"/>
                    <line x1="75" y1="118" x2="125" y2="118" stroke="#16A34A" strokeWidth="3"/>
                  </svg>
                </div>
              </div>
            )}

            {activeTab === 'docking' && (
              <div className="hero-banner-card">
                <div className="hero-banner-content">
                  <div className="hero-tag">— COMPUTER-AIDED DRUG DESIGN</div>
                  <h2>Dynamic In Silico Protein-Ligand Docking</h2>
                  <p>Estimate binding affinities (kcal/mol), hydrophobic pocket contact scores, and hydrogen bonding interaction profiles.</p>
                  
                  <div className="hero-indicators-grid">
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">⚡</div><span>Binding Affinity</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🎯</div><span>Pocket Identification</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🧪</div><span>Ligand Pose Score</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">📈</div><span>Interaction Profiling</span></div>
                  </div>
                </div>
                <div className="hero-banner-graphic">
                  <svg width="200" height="160" viewBox="0 0 200 160">
                    <circle cx="100" cy="80" r="50" fill="#E4F5F4" stroke="#087F8C" strokeWidth="3" />
                    <rect x="85" y="65" width="30" height="30" rx="6" fill="#15365B" />
                    <line x1="100" y1="30" x2="100" y2="65" stroke="#16A34A" strokeWidth="3" strokeDasharray="3,3" />
                  </svg>
                </div>
              </div>
            )}

            {activeTab === 'agent' && (
              <div className="hero-banner-card">
                <div className="hero-banner-content">
                  <div className="hero-tag">— CONVERSATIONAL MULTI-OMICS ROUTER</div>
                  <h2>Natural Language Multi-Domain AI Router</h2>
                  <p>Ask natural language questions across proteomics, drug design, genomics, and structure prediction seamlessly.</p>
                  
                  <div className="hero-indicators-grid">
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🤖</div><span>NLP Query Intent</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">🔀</div><span>Dynamic Routing</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">💬</div><span>Interactive Chat</span></div>
                    <div className="feature-indicator-item"><div className="feature-indicator-icon">📄</div><span>Unified Reports</span></div>
                  </div>
                </div>
                <div className="hero-banner-graphic">
                  <svg width="200" height="160" viewBox="0 0 200 160">
                    <rect x="40" y="40" width="120" height="80" rx="12" fill="#087F8C" opacity="0.85" />
                    <circle cx="75" cy="70" r="8" fill="#FFFFFF" />
                    <circle cx="125" cy="70" r="8" fill="#FFFFFF" />
                    <path d="M 80 95 Q 100 110, 120 95" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;