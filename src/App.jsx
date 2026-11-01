import React, { useState, useEffect, useMemo } from 'react';
import BudgetCalculator from './components/BudgetCalculator';
import HousingDashboard from './components/HousingDashboard';
import { generateListings } from './data/listings';
import { calculateBudgetLimits, scoreAndCategorizeListings, generateInsights, fetchGeminiInsights } from './utils/affordabilityEngine';
import { Sparkles, HelpCircle, ShieldAlert, BookOpen, Sun, Moon } from 'lucide-react';
import ChatAssistant from './components/ChatAssistant';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('keystart_theme') || 'dark';
  });

  // Apply theme to HTML tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('keystart_theme', theme);
  }, [theme]);

  const [inputs, setInputs] = useState({
    salary: 4000,
    savingsGoal: 1000,
    dailyExpenses: 30, // Default Food $15 + Transport $5 + Leisure $10
    regions: ['Any'],
    housingTypes: ['Any'],
    mrtProximity: 'Nice to Have',
    distancePreference: 'Flexible',
    amenities: []
  });

  const [rawListings, setRawListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isCalculatorCollapsed, setIsCalculatorCollapsed] = useState(false);
  
  // Property sync state simulation
  const [lastSyncTime, setLastSyncTime] = useState('2 minutes ago');
  const [isSyncing, setIsSyncing] = useState(false);

  // AI Insights state
  const [insights, setInsights] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUsingGemini, setIsUsingGemini] = useState(false);

  // Load procedural listings database on mount
  useEffect(() => {
    const list = generateListings();
    setRawListings(list);
  }, []);



  // Calculate budget limits based on financials
  const budget = useMemo(() => {
    return calculateBudgetLimits(inputs.salary, inputs.savingsGoal, inputs.dailyExpenses);
  }, [inputs.salary, inputs.savingsGoal, inputs.dailyExpenses]);

  // Score and categorize raw listings
  const processedListings = useMemo(() => {
    if (rawListings.length === 0) return [];
    return scoreAndCategorizeListings(rawListings, inputs, budget);
  }, [rawListings, inputs, budget]);

  // Load insights — must be declared after budget and processedListings
  const handleLoadInsights = async (forceGemini = false) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const hasApiKey = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '';

    setIsAiLoading(true);
    if (forceGemini && hasApiKey) {
      setIsUsingGemini(true);
      const res = await fetchGeminiInsights(inputs, processedListings, budget, apiKey);
      setInsights(res);
    } else {
      setIsUsingGemini(false);
      const res = generateInsights(inputs, processedListings, budget);
      setInsights(res);
    }
    setIsAiLoading(false);
  };

  // Auto-refresh rule-based insights when inputs or listings change
  useEffect(() => {
    if (processedListings.length > 0) {
      handleLoadInsights(false);
    }
  }, [inputs.salary, inputs.savingsGoal, inputs.dailyExpenses, inputs.regions, inputs.housingTypes, inputs.amenities, processedListings.length]);

  // Auto-select a default listing when inputs/listings change if nothing is selected or if previous selection is out of range
  useEffect(() => {
    if (processedListings.length > 0) {
      const isStillInList = selectedListing && processedListings.some(l => l.id === selectedListing.id);
      if (!isStillInList) {
        // Try to select first SAFE listing, otherwise first available listing
        const defaultSelect = processedListings.find(l => l.tier === 'Safe') || processedListings[0];
        setSelectedListing(defaultSelect);
      } else if (selectedListing) {
        // Sync selected listing with updated parameters (e.g. if rent fluctuates during sync)
        const updatedRef = processedListings.find(l => l.id === selectedListing.id);
        if (updatedRef && updatedRef.rent !== selectedListing.rent) {
          setSelectedListing(updatedRef);
        }
      }
    }
  }, [processedListings, selectedListing]);

  // Handle inputs updates
  const handleInputChange = (field, value) => {
    if (field === 'all') {
      setInputs(value);
    } else {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Simulate Property Portal API Sync (PropertyGuru, SRX)
  const handleSyncRates = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setRawListings(prev => {
        return prev.map(item => {
          // Fluctuates by -6% to +6% for realistic volatility
          const deviation = 0.94 + Math.random() * 0.12;
          const newRent = Math.round((item.rent * deviation) / 50) * 50;
          return {
            ...item,
            rent: newRent
          };
        });
      });
      
      // Reset timestamp tracker
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
      setLastSyncTime(`at ${timeStr}`);
      setIsSyncing(false);
    }, 1200);
  };

  const formatSGD = (v) => new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(v);

  // Scroll to the workspace section
  const scrollToApp = () => {
    document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>

      {/* ── CINEMATIC HERO ── */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-overlay" />

        {/* Nav */}
        <nav className="hero-nav">
          <div className="nav-left">
            <button onClick={scrollToApp} className="nav-pill-btn sage">
              Get Started &nbsp;→
            </button>
          </div>

          <div className="nav-center desktop-only">
            <span className="nav-logo-text">KeyStart</span>
          </div>

          <div className="nav-right">
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="theme-toggle-btn"
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </nav>

        {/* Display Title */}
        <div className="hero-title-block">
          <h1 className="hero-display-title">KeyStart</h1>
          <p className="hero-subtitle">Singapore Housing Affordability Guide</p>
          <div className="hero-cta-row">
            <button onClick={scrollToApp} className="nav-pill-btn sage">
              Explore Housing →
            </button>
            <button onClick={scrollToApp} className="nav-pill-btn">
              View Projections
            </button>
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="hero-bottom-strip">
          <div className="hero-strip-item">
            <span className="strip-label">Safe Housing Budget</span>
            <span className="strip-value sage">{formatSGD(budget.safeRentLimit)}<span style={{fontSize:'12px',color:'var(--text-muted)'}}>/mo</span></span>
            <span className="strip-desc">Recommended limit for financial peace of mind</span>
          </div>
          <div className="hero-strip-item">
            <span className="strip-label">Stretch Limit</span>
            <span className="strip-value cream">{formatSGD(budget.stretchRentLimit)}<span style={{fontSize:'12px',color:'var(--text-muted)'}}>/mo</span></span>
            <span className="strip-desc">Maximum before savings goal is compromised</span>
          </div>
          <div className="hero-strip-item">
            <span className="strip-label">Listings Analysed</span>
            <span className="strip-value">{processedListings.length}</span>
            <span className="strip-desc">HDB, Co-living & Condo across 5 regions</span>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE ── */}
      <div id="workspace" className="workspace-outer">
        <div className="section-label">Budget Planner & Recommendations</div>

        <div className="workspace-layout">
          {/* Input Panel */}
          <aside>
            <BudgetCalculator
              inputs={inputs}
              onChange={handleInputChange}
              isCollapsed={isCalculatorCollapsed}
              onToggleCollapse={() => setIsCalculatorCollapsed(!isCalculatorCollapsed)}
            />
          </aside>

          {/* Dashboard */}
          <section>
            {isCalculatorCollapsed && (
              <div className="mobile-float-banner animate-slide-in">
                <span>Inputs hidden</span>
                <button onClick={() => setIsCalculatorCollapsed(false)}>Edit Inputs</button>
              </div>
            )}
            <HousingDashboard
              inputs={inputs}
              budget={budget}
              listings={processedListings}
              selectedListing={selectedListing}
              onSelectListing={setSelectedListing}
              onSyncRates={handleSyncRates}
              lastSyncTime={lastSyncTime}
              isSyncing={isSyncing}
              insights={insights}
              isAiLoading={isAiLoading}
              isUsingGemini={isUsingGemini}
              onAskGemini={() => handleLoadInsights(true)}
              hasApiKey={!!(import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'your_gemini_api_key_here' && import.meta.env.VITE_GEMINI_API_KEY.trim() !== '')}
            />
          </section>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="https://www.hdb.gov.sg/cs/infoweb/residential/renting-a-flat" target="_blank" rel="noreferrer">
              <BookOpen size={12} /><span>HDB Rental Guidelines</span>
            </a>
            <a href="https://www.mas.gov.sg/consumers" target="_blank" rel="noreferrer">
              <HelpCircle size={12} /><span>MAS MoneySense Advice</span>
            </a>
          </div>
          <p>© 2026 KeyStart AI · Procedural listings represent current rental trends for HDB rooms/flats, private co-living suites, and condominiums across 28 districts in Singapore. Projected savings models do not guarantee future investment returns.</p>
        </div>
      </footer>
      {/* ── FLOATING THEME TOGGLE ── */}
      <button
        onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        className="theme-float-btn"
        title="Toggle Light/Dark Mode"
        aria-label="Toggle light and dark mode"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* ── AI CHAT ASSISTANT ── */}
      <ChatAssistant inputs={inputs} budget={budget} listings={processedListings} />
    </div>
  );
}
