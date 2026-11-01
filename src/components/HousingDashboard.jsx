import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, Info, MapPin, Train, AlertTriangle,
  Lightbulb, Search, ArrowUpDown, Building, Sparkles,
  ArrowLeft, ExternalLink, CheckCircle2, AlertCircle
} from 'lucide-react';
import { projectFiveYearSustainability } from '../utils/affordabilityEngine';

const AREA_MAP = {
  'Tampines':     { pg: 'Tampines',      srx: 'tampines' },
  'Bedok':        { pg: 'Bedok',         srx: 'bedok' },
  'Pasir Ris':    { pg: 'Pasir+Ris',     srx: 'pasir-ris' },
  'Geylang':      { pg: 'Geylang',       srx: 'geylang' },
  'Clementi':     { pg: 'Clementi',      srx: 'clementi' },
  'Jurong East':  { pg: 'Jurong+East',   srx: 'jurong-east' },
  'Bukit Batok':  { pg: 'Bukit+Batok',   srx: 'bukit-batok' },
  'Woodlands':    { pg: 'Woodlands',     srx: 'woodlands' },
  'Yishun':       { pg: 'Yishun',        srx: 'yishun' },
  'Sembawang':    { pg: 'Sembawang',     srx: 'sembawang' },
  'Punggol':      { pg: 'Punggol',       srx: 'punggol' },
  'Sengkang':     { pg: 'Sengkang',      srx: 'sengkang' },
  'Serangoon':    { pg: 'Serangoon',     srx: 'serangoon' },
  'Tanjong Pagar':{ pg: 'Tanjong+Pagar', srx: 'tanjong-pagar' },
  'Queenstown':   { pg: 'Queenstown',    srx: 'queenstown' },
  'Bukit Merah':  { pg: 'Bukit+Merah',   srx: 'bukit-merah' },
  'Lavender':     { pg: 'Lavender',      srx: 'lavender' },
  'Novena':       { pg: 'Novena',        srx: 'novena' },
};

function getAreaInfo(district) {
  for (const area in AREA_MAP) {
    if (district && district.includes(area)) return AREA_MAP[area];
  }
  return { pg: 'Singapore', srx: 'singapore' };
}

function buildPGUrl(item) {
  const area = getAreaInfo(item.district);
  const minPrice = Math.round(item.rent * 0.85);
  const maxPrice = Math.round(item.rent * 1.15);
  const pgType = item.type && item.type.includes('HDB') ? 'H' : 'N';
  return `https://www.propertyguru.com.sg/property-for-rent?freetext=${area.pg}&minPrice=${minPrice}&maxPrice=${maxPrice}&propertyTypeGroup=${pgType}&listingType=rent&isCommercial=false&locale=en&_freetextDisplay=${area.pg}`;
}

function buildSRXUrl(item) {
  const area = getAreaInfo(item.district);
  return `https://www.srx.com.sg/search/rent/residential/${area.srx}`;
}

function ListingDetail({ item, budget, inputs, onBack, onSelectListing, selectedListing, formatSGD }) {
  const isSelected = selectedListing && selectedListing.id === item.id;
  const buffer = inputs.salary - item.rent - budget.monthlyExpenses - inputs.savingsGoal;

  const donutData = useMemo(() => {
    const total = inputs.salary;
    const parts = [
      { label: 'Housing Rent', value: item.rent, color: '#3B82F6' },
      { label: 'Daily Expenses', value: budget.monthlyExpenses, color: '#EC4899' },
      { label: 'Savings Target', value: inputs.savingsGoal, color: '#10B981' },
      { label: 'Monthly Buffer', value: Math.max(0, buffer), color: '#8B5CF6' },
    ];
    let currentAngle = 0;
    const circumference = 2 * Math.PI * 40;
    return parts.map(part => {
      const percentage = Math.max(0, (part.value / total) * 100);
      const dashArray = (percentage / 100) * circumference;
      const strokeOffset = circumference - currentAngle;
      currentAngle += dashArray;
      return { ...part, percentage: Math.round(percentage), dashArray, strokeOffset };
    });
  }, [item.rent, budget, inputs]);

  const scoreBreakdown = [
    { label: 'Price', score: item.priceScore ?? 0 },
    { label: 'Region', score: inputs.regions?.includes(item.region) || inputs.regions?.includes('Any') ? 100 : 0 },
    { label: 'Housing type', score: inputs.housingTypes?.includes(item.type) || inputs.housingTypes?.includes('Any') ? 100 : 0 },
    { label: 'MRT proximity', score: item.walkToMrtMins <= 5 ? 100 : item.walkToMrtMins <= 8 ? 80 : item.walkToMrtMins <= 12 ? 50 : 20 },
    { label: 'Amenities', score: !inputs.amenities?.length ? 100 : Math.round((item.amenities?.filter(a => inputs.amenities?.includes(a)).length / (inputs.amenities?.length || 1)) * 100) },
  ];

  const affordabilityTier = item.rent <= budget.safeRentLimit ? 'safe' : item.rent <= budget.stretchRentLimit ? 'stretch' : 'over';

  const reasons = [
    {
      ok: item.rent <= budget.safeRentLimit,
      text: item.rent <= budget.safeRentLimit
        ? `Rent of ${formatSGD(item.rent)} is within your safe limit of ${formatSGD(budget.safeRentLimit)} — ${formatSGD(budget.safeRentLimit - item.rent)} below`
        : item.rent <= budget.stretchRentLimit
        ? `Rent of ${formatSGD(item.rent)} is above safe limit (${formatSGD(budget.safeRentLimit)}) but within stretch limit`
        : `Rent of ${formatSGD(item.rent)} exceeds your stretch limit of ${formatSGD(budget.stretchRentLimit)}`,
    },
    {
      ok: inputs.regions?.includes(item.region) || inputs.regions?.includes('Any') || !inputs.regions?.length,
      text: inputs.regions?.includes(item.region)
        ? `Located in ${item.region} which matches your region preference`
        : `Located in ${item.region} — outside your preferred areas`,
    },
    {
      ok: item.walkToMrtMins <= 8,
      text: item.walkToMrtMins <= 5
        ? `${item.mrt} is just ${item.walkToMrtMins} min walk — excellent MRT access`
        : item.walkToMrtMins <= 8
        ? `${item.mrt} is ${item.walkToMrtMins} min walk — good MRT access`
        : `${item.mrt} is ${item.walkToMrtMins} min walk — further than ideal`,
    },
  ];

  return (
    <div className="listing-detail-view">
      <button className="detail-back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Back to listings</span>
      </button>

      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-badges">
            <span className={`match-badge ${item.matchScore >= 70 ? 'bg-mint' : item.matchScore >= 40 ? 'bg-orange' : 'bg-coral'}`}>
              {item.matchScore}% Match
            </span>
            <span className={`tier-pill tier-pill-${affordabilityTier}`}>
              {affordabilityTier === 'safe' ? 'Safe Tier' : affordabilityTier === 'stretch' ? 'Stretch Tier' : 'Over Budget'}
            </span>
          </div>
          <h2 className="detail-title">{item.title}</h2>
          <div className="listing-loc-details" style={{ marginTop: '6px' }}>
            <div className="detail-item"><MapPin size={13} className="text-muted" /><span>{item.district} ({item.region})</span></div>
            <div className="detail-item"><Train size={13} className="text-muted" /><span>{item.mrt} ({item.walkToMrtMins}m walk)</span></div>
          </div>
        </div>
        <div className="detail-header-right">
          <div className="detail-rent">{formatSGD(item.rent)}<span className="per-mo">/mo</span></div>
          <div className={`detail-rent-vs ${affordabilityTier === 'safe' ? 'color-mint' : affordabilityTier === 'stretch' ? 'color-orange' : 'color-coral'}`}>
            {affordabilityTier === 'safe'
              ? `${formatSGD(budget.safeRentLimit - item.rent)} below safe limit`
              : affordabilityTier === 'stretch'
              ? `${formatSGD(item.rent - budget.safeRentLimit)} above safe limit`
              : `${formatSGD(item.rent - budget.stretchRentLimit)} above stretch limit`}
          </div>
        </div>
      </div>

      <div className="detail-stats-row">
        <div className="glass-card detail-stat-card">
          <div className="stat-val color-mint">{formatSGD(budget.safeRentLimit)}</div>
          <div className="stat-lbl">Your safe limit</div>
        </div>
        <div className="glass-card detail-stat-card">
          <div className="stat-val">{formatSGD(Math.max(0, buffer))}</div>
          <div className="stat-lbl">Monthly buffer</div>
        </div>
        <div className="glass-card detail-stat-card">
          <div className="stat-val color-blue">{item.walkToMrtMins} min</div>
          <div className="stat-lbl">Walk to MRT</div>
        </div>
      </div>

      <div className="detail-grid-2">
        <div className="glass-card detail-section">
          <h4 className="detail-section-title">Match breakdown</h4>
          {scoreBreakdown.map((row, i) => (
            <div key={i} className="match-row">
              <span className="match-row-label">{row.label}</span>
              <div className="match-bar-track">
                <div className="match-bar-fill" style={{ width: `${row.score}%`, background: row.score >= 70 ? '#10B981' : row.score >= 40 ? '#F59E0B' : '#EF4444' }} />
              </div>
              <span className="match-row-score" style={{ color: row.score >= 70 ? '#10B981' : row.score >= 40 ? '#F59E0B' : '#EF4444' }}>{row.score}</span>
            </div>
          ))}
        </div>

        <div className="glass-card detail-section">
          <h4 className="detail-section-title">Budget with this listing</h4>
          <div className="donut-chart-container">
            <svg width="120" height="120" viewBox="0 0 100 100" className="donut-svg">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-mid)" strokeWidth="12" />
              {donutData.map((slice, i) => (
                <circle key={i} cx="50" cy="50" r="40" fill="transparent" stroke={slice.color} strokeWidth="12"
                  strokeDasharray={`${slice.dashArray} 251.3`} strokeDashoffset={slice.strokeOffset}
                  transform="rotate(-90 50 50)" className="donut-slice" />
              ))}
              <g className="donut-text">
                <text x="50" y="48" textAnchor="middle" fill="var(--text-bright)" fontSize="9" fontWeight="bold">{formatSGD(inputs.salary)}</text>
                <text x="50" y="58" textAnchor="middle" fill="var(--text-muted)" fontSize="6">Salary / mo</text>
              </g>
            </svg>
            <div className="donut-legend">
              {donutData.map((slice, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-color-dot" style={{ backgroundColor: slice.color }}></span>
                  <span className="legend-lbl">{slice.label} ({slice.percentage}%)</span>
                  <span className="legend-val">{formatSGD(slice.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card detail-section">
        <h4 className="detail-section-title">Why this fits you</h4>
        {reasons.map((r, i) => (
          <div key={i} className="why-row">
            {r.ok ? <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} /> : <AlertCircle size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />}
            <span className="why-text">{r.text}</span>
          </div>
        ))}
        <div style={{ marginTop: '12px' }}>
          <span className="card-label" style={{ fontSize: '11px' }}>Amenities</span>
          <div className="listing-amenities" style={{ marginTop: '6px' }}>
            {item.amenities.map((a, i) => <span key={i} className="amenity-badge">{a}</span>)}
          </div>
        </div>
      </div>

      <div className="glass-card detail-section">
        <h4 className="detail-section-title">About this listing</h4>
        <p className="listing-desc" style={{ margin: 0 }}>{item.description}</p>
      </div>

      <div className="detail-actions">
        <a href={buildPGUrl(item)} target="_blank" rel="noopener noreferrer" className="compare-link compare-link-pg">
          <ExternalLink size={13} /> Compare on PropertyGuru
        </a>
        <a href={buildSRXUrl(item)} target="_blank" rel="noopener noreferrer" className="compare-link compare-link-srx">
          <ExternalLink size={13} /> Compare on SRX
        </a>
      </div>

      <button
        className={`select-listing-btn ${isSelected ? 'btn-selected' : 'btn-unselected'}`}
        style={{ width: '100%', marginTop: '8px' }}
        onClick={() => { onSelectListing(item); onBack(); }}
      >
        {isSelected ? 'Selected — Simulating Sustainability' : 'Simulate Sustainability'}
      </button>
    </div>
  );
}

export default function HousingDashboard({ 
  inputs, budget, listings, selectedListing, onSelectListing,
  onSyncRates, lastSyncTime, isSyncing,
  insights, isAiLoading, isUsingGemini, onAskGemini, hasApiKey
}) {
  const [activeTab, setActiveTab] = useState('Safe');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('matchScore');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [detailListing, setDetailListing] = useState(null);

  const formatSGD = (val) => new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(val);

  const tieredListings = useMemo(() => {
    const grouped = { Safe: [], Stretch: [], Unsustainable: [] };
    listings.forEach(item => { if (grouped[item.tier]) grouped[item.tier].push(item); });
    return grouped;
  }, [listings]);

  const processedListings = useMemo(() => {
    let list = [...(tieredListings[activeTab] || [])];
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.district.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.mrt.toLowerCase().includes(query)
      );
    }
    if (sortBy === 'matchScore') list.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'rentAsc') list.sort((a, b) => a.rent - b.rent);
    else if (sortBy === 'rentDesc') list.sort((a, b) => b.rent - a.rent);
    return list;
  }, [tieredListings, activeTab, searchTerm, sortBy]);

  const tierAverages = useMemo(() => {
    const averages = { Safe: 900, Stretch: 1600, Unsustainable: 2800 };
    Object.keys(tieredListings).forEach(tier => {
      const list = tieredListings[tier];
      if (list.length > 0) averages[tier] = Math.round(list.reduce((acc, curr) => acc + curr.rent, 0) / list.length);
    });
    return averages;
  }, [tieredListings]);

  const projections = useMemo(() => projectFiveYearSustainability(inputs, tierAverages), [inputs, tierAverages]);

  const rentCost = selectedListing ? selectedListing.rent : (inputs.salary * 0.25);
  const monthlyExpenses = budget.monthlyExpenses;
  const savingsGoal = inputs.savingsGoal;
  const remainingBuffer = inputs.salary - rentCost - monthlyExpenses - savingsGoal;

  const donutData = useMemo(() => {
    const total = inputs.salary;
    const parts = [
      { label: 'Housing Rent', value: rentCost, color: '#3B82F6' },
      { label: 'Daily Expenses', value: monthlyExpenses, color: '#EC4899' },
      { label: 'Savings Target', value: savingsGoal, color: '#10B981' },
      { label: 'Savings Buffer', value: Math.max(0, remainingBuffer), color: '#8B5CF6' }
    ];
    let currentAngle = 0;
    const circumference = 2 * Math.PI * 40;
    return parts.map(part => {
      const percentage = Math.max(0, (part.value / total) * 100);
      const dashArray = (percentage / 100) * circumference;
      const strokeOffset = circumference - currentAngle;
      currentAngle += dashArray;
      return { ...part, percentage: Math.round(percentage), dashArray, strokeOffset };
    });
  }, [inputs.salary, rentCost, monthlyExpenses, savingsGoal, remainingBuffer]);

  const lineChartData = useMemo(() => {
    const width = 500, height = 220, paddingLeft = 65, paddingRight = 20, paddingTop = 20, paddingBottom = 45;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const allValues = [
      ...projections.Safe.map(d => d.cumulativeSavings),
      ...projections.Stretch.map(d => d.cumulativeSavings),
      ...projections.Unsustainable.map(d => d.cumulativeSavings)
    ];
    const minY = Math.min(...allValues, -10000);
    const maxY = Math.max(...allValues, 20000);
    const yRange = maxY - minY;
    const getX = (year) => paddingLeft + ((year - 1) / 4) * chartWidth;
    const getY = (val) => height - paddingBottom - ((val - minY) / yRange) * chartHeight;
    const makePath = (tierData) => tierData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.year)} ${getY(d.cumulativeSavings)}`).join(' ');
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const val = minY + (i / 4) * yRange;
      gridLines.push({ y: getY(val), label: formatSGD(val) });
    }
    return {
      width, height, paddingLeft, paddingBottom, getX, getY,
      paths: { Safe: makePath(projections.Safe), Stretch: makePath(projections.Stretch), Unsustainable: makePath(projections.Unsustainable) },
      points: {
        Safe: projections.Safe.map(d => ({ x: getX(d.year), y: getY(d.cumulativeSavings), ...d })),
        Stretch: projections.Stretch.map(d => ({ x: getX(d.year), y: getY(d.cumulativeSavings), ...d })),
        Unsustainable: projections.Unsustainable.map(d => ({ x: getX(d.year), y: getY(d.cumulativeSavings), ...d }))
      },
      gridLines
    };
  }, [projections]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-summary-cards">
        <div className="glass-card summary-card border-left-blue">
          <span className="strip-label">Safe Housing Budget</span>
          <span className="strip-value sage">{formatSGD(budget.safeRentLimit)}<span style={{fontSize:'12px',color:'var(--text-muted)',fontWeight:400}}>/mo</span></span>
          <span className="strip-desc">Max recommended for financial peace</span>
        </div>
        <div className="glass-card summary-card border-left-orange">
          <span className="strip-label">Stretch Limit</span>
          <span className="strip-value cream">{formatSGD(budget.stretchRentLimit)}<span style={{fontSize:'12px',color:'var(--text-muted)',fontWeight:400}}>/mo</span></span>
          <span className="strip-desc">Max limit before saving goal fails</span>
        </div>
        <div className="glass-card summary-card border-left-purple">
          <span className="strip-label">Net Disposable Income</span>
          <span className="strip-value">{formatSGD(budget.disposableIncome)}<span style={{fontSize:'12px',color:'var(--text-muted)',fontWeight:400}}>/mo</span></span>
          <span className="strip-desc">Remaining after savings & living costs</span>
        </div>
        <div className="glass-card sync-panel-card">
          <div className="sync-status">
            <span className={`status-dot ${isSyncing ? 'anim-pulse-sync' : 'status-fresh'}`}></span>
            <div>
              <span className="sync-title">Property Portal Sync</span>
              <span className="sync-time">API Status: Synced {lastSyncTime} ago</span>
            </div>
          </div>
          <button onClick={onSyncRates} disabled={isSyncing} className="sync-btn">
            <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live Rates'}</span>
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="visuals-column">
          {(remainingBuffer < 0 || selectedListing) && (
            <div className="glass-card" style={{ padding: '12px 16px' }}>
              {remainingBuffer < 0 && (
                <div className="budget-alert-banner">
                  <AlertTriangle size={16} />
                  <span><strong>Budget Warning:</strong> Expenses + savings exceed your salary by {formatSGD(Math.abs(remainingBuffer))}/mo.</span>
                </div>
              )}
              {selectedListing && (
                <div className="selected-listing-preview">
                  <Building size={16} className="font-blue" />
                  <span>Selected: <strong>{selectedListing.title}</strong> ({formatSGD(selectedListing.rent)}/mo) — open View Details for full breakdown</span>
                </div>
              )}
            </div>
          )}

          <div className="glass-card chart-section">
            <div className="chart-header">
              <h3>5-Year Cumulative Savings Projection</h3>
              <span className="chart-tip-text"><Info size={12} /> Assumes 5% salary growth vs 3% inflation</span>
            </div>
            <div className="projection-container">
              <svg width="100%" height="220" viewBox={`0 0 ${lineChartData.width} ${lineChartData.height}`} className="line-chart-svg">
                {lineChartData.gridLines.map((line, idx) => (
                  <g key={idx}>
                    <line x1={lineChartData.paddingLeft} y1={line.y} x2={lineChartData.width - 20} y2={line.y} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={lineChartData.paddingLeft - 8} y={line.y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{line.label}</text>
                  </g>
                ))}
                {[1, 2, 3, 4, 5].map(year => (
                  <text key={year} x={lineChartData.getX(year)} y={lineChartData.height - 25} fill="var(--text-muted)" fontSize="9" textAnchor="middle">Year {year}</text>
                ))}
                <path d={lineChartData.paths.Safe} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" className="chart-line" />
                <path d={lineChartData.paths.Stretch} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" className="chart-line" />
                {Object.keys(lineChartData.points).filter(k => k !== 'Unsustainable').map(tierKey => {
                  const color = tierKey === 'Safe' ? '#10B981' : '#F59E0B';
                  return lineChartData.points[tierKey].map((pt, idx) => (
                    <circle key={`${tierKey}-${idx}`} cx={pt.x} cy={pt.y} r="4" fill={color} stroke="var(--bg-canvas)" strokeWidth="1.5" className="chart-dot"
                      onMouseEnter={() => setHoveredPoint({ ...pt, tier: tierKey })}
                      onMouseLeave={() => setHoveredPoint(null)} />
                  ));
                })}
              </svg>
              {hoveredPoint && (
                <div className="chart-tooltip glass-card" style={{ position: 'absolute', left: `${hoveredPoint.x + 20}px`, top: `${hoveredPoint.y - 20}px`, zIndex: 10 }}>
                  <span className="tooltip-title">{hoveredPoint.tier} Option (Year {hoveredPoint.year})</span>
                  <div className="tooltip-row"><span>Rent:</span> <strong>{formatSGD(hoveredPoint.rent)}/mo</strong></div>
                  <div className="tooltip-row"><span>Savings:</span> <strong className="font-mint">{formatSGD(hoveredPoint.cumulativeSavings)}</strong></div>
                  <div className="tooltip-row"><span>Buffer:</span> <strong className={hoveredPoint.buffer >= 0 ? 'font-mint' : 'font-coral'}>{formatSGD(hoveredPoint.buffer)}/mo</strong></div>
                </div>
              )}
            </div>
            <div className="line-legend">
              <div className="legend-item"><span className="legend-line-dot bg-mint"></span><span>Safe (Avg. {formatSGD(tierAverages.Safe)}/mo)</span></div>
              <div className="legend-item"><span className="legend-line-dot bg-orange dashed"></span><span>Stretch (Avg. {formatSGD(tierAverages.Stretch)}/mo)</span></div>
            </div>
          </div>

          <div className="glass-card insights-card">
            <div className="insights-header">
              <div className="insights-title-row">
                <Lightbulb className="icon-mint animate-pulse" size={20} />
                <h3>AI Actionable Insights</h3>
                {isUsingGemini && <span className="gemini-badge-ai">Gemini AI</span>}
              </div>
              {hasApiKey ? (
                <button onClick={onAskGemini} disabled={isAiLoading} className="ask-gemini-btn">
                  <Sparkles size={12} className={isAiLoading ? 'spin-anim' : ''} style={{ marginRight: '6px' }} />
                  <span>{isAiLoading ? 'Thinking...' : 'Ask Gemini AI'}</span>
                </button>
              ) : (
                <span className="api-key-missing-badge">Local Advisor Mode</span>
              )}
            </div>
            {isAiLoading ? (
              <div className="ai-loading-container">
                <div className="spinner-loader"></div>
                <p>Gemini is tailoring recommendations for your Singapore budget...</p>
              </div>
            ) : (
              <div className="insights-list">
                {insights.map((insight, idx) => (
                  <div key={idx} className="insight-item">
                    <div className="insight-left">
                      <span className="insight-metric">{insight.metric}</span>
                      <span className="insight-title">{insight.title}</span>
                      <p className="insight-desc">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="listings-column">
          <div className="glass-card listings-explorer-card">
            {detailListing ? (
              <ListingDetail
                item={detailListing}
                budget={budget}
                inputs={inputs}
                formatSGD={formatSGD}
                onBack={() => setDetailListing(null)}
                onSelectListing={(item) => { onSelectListing(item); setDetailListing(null); }}
                selectedListing={selectedListing}
              />
            ) : (
              <>
                <div className="listing-filters">
                  <div className="search-box">
                    <Search size={16} className="text-muted" />
                    <input type="text" placeholder="Search location, MRT, or flat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="sort-box">
                    <ArrowUpDown size={14} className="text-muted" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                      <option value="matchScore">Best Match Score</option>
                      <option value="rentAsc">Rent (Low to High)</option>
                      <option value="rentDesc">Rent (High to Low)</option>
                    </select>
                  </div>
                </div>

                <div className="tiers-tabs">
                  {[
                    { key: 'Safe', count: tieredListings.Safe.length, colorClass: 'tab-safe' },
                    { key: 'Stretch', count: tieredListings.Stretch.length, colorClass: 'tab-stretch' },
                  ].map(({ key, count, colorClass }) => (
                    <button key={key} onClick={() => setActiveTab(key)} className={`tier-tab-btn ${activeTab === key ? `active ${colorClass}` : ''}`}>
                      <span>{key} Tier</span>
                      <span className="tier-count">{count}</span>
                    </button>
                  ))}
                </div>

                <div className="listings-list">
                  {processedListings.length === 0 ? (
                    <div className="empty-listings-state">
                      <Building size={32} className="text-muted" />
                      <p>No listings matched your criteria in this tier.</p>
                      {searchTerm && <button onClick={() => setSearchTerm('')} className="btn-edit-inline mt-2">Clear Search Filter</button>}
                    </div>
                  ) : (
                    processedListings.map(item => {
                      const isSelected = selectedListing && selectedListing.id === item.id;
                      let matchColor = 'bg-coral';
                      if (item.matchScore >= 70) matchColor = 'bg-mint';
                      else if (item.matchScore >= 40) matchColor = 'bg-orange';

                      return (
                        <div
                          key={item.id}
                          className={`listing-card glass-card ${isSelected ? 'selected-listing-border' : ''} hover-glow`}
                          onClick={() => setDetailListing(item)}
                        >
                          <div className="card-top-info">
                            <span className={`match-badge ${matchColor}`}>{item.matchScore}% Match</span>
                            <span className="listing-price">{formatSGD(item.rent)}<span className="per-mo">/mo</span></span>
                          </div>
                          <h4 className="listing-title">{item.title}</h4>
                          <div className="listing-loc-details">
                            <div className="detail-item"><MapPin size={12} className="text-muted" /><span>{item.district} ({item.region})</span></div>
                            <div className="detail-item"><Train size={12} className="text-muted" /><span>{item.mrt} ({item.walkToMrtMins}m walk)</span></div>
                          </div>
                          <p className="listing-desc">{item.description}</p>
                          <div className="listing-amenities">
                            {item.amenities.map((a, aIdx) => <span key={aIdx} className="amenity-badge">{a}</span>)}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button
                              className="select-listing-btn btn-unselected"
                              style={{ flex: 1, background: 'rgba(125,184,138,0.15)', borderColor: 'var(--sage-border)', color: 'var(--sage)' }}
                              onClick={(e) => { e.stopPropagation(); setDetailListing(item); }}
                            >
                              View Details →
                            </button>
                            <button
                              className={`select-listing-btn ${isSelected ? 'btn-selected' : 'btn-unselected'}`}
                              style={{ flex: 1 }}
                              onClick={(e) => { e.stopPropagation(); onSelectListing(item); }}
                            >
                              {isSelected ? 'Selected' : 'Simulate'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
