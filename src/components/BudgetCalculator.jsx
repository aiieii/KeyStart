import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  MapPin, 
  Train, 
  Heart, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Trash, 
  FolderOpen, 
  Sparkles,
  Home,
  AlertCircle
} from 'lucide-react';

const AMENITIES_POOL = [
  'Gym',
  'Swimming Pool',
  'Supermarket',
  'Hawker Center',
  'Mall',
  'Quiet Area',
  'Cooking Allowed',
  'Visitor Friendly',
  'High-Speed Wi-Fi',
  'Air Conditioning'
];

const REGIONS = ['Central', 'East', 'West', 'North', 'North-East'];
const HOUSING_TYPES = ['HDB Room', 'Co-living Room', 'Condo Room', 'HDB Flat (Whole)', 'Condo Flat (Whole)'];

export default function BudgetCalculator({ inputs, onChange, isCollapsed, onToggleCollapse }) {
  const [step, setStep] = useState(1);
  const [profiles, setProfiles] = useState({});
  const [profileName, setProfileName] = useState('');
  const [selectedProfileKey, setSelectedProfileKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Itemized daily expense state for easier calculations
  const [foodExp, setFoodExp] = useState(15);
  const [transportExp, setTransportExp] = useState(5);
  const [leisureExp, setLeisureExp] = useState(10);

  // Sync itemized expenses to dailyExpenses input
  useEffect(() => {
    const totalDaily = parseFloat(foodExp) + parseFloat(transportExp) + parseFloat(leisureExp);
    if (!isNaN(totalDaily) && totalDaily !== inputs.dailyExpenses) {
      onChange('dailyExpenses', totalDaily);
    }
  }, [foodExp, transportExp, leisureExp]);

  // Load profiles list from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sg_housing_profiles');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfiles(parsed);
        
        // Find default or last saved profile if exists
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          const lastActive = localStorage.getItem('sg_housing_active_profile_key');
          if (lastActive && parsed[lastActive]) {
            setSelectedProfileKey(lastActive);
            // Load its itemized values if they exist
            const p = parsed[lastActive];
            setFoodExp(p.foodExp || 15);
            setTransportExp(p.transportExp || 5);
            setLeisureExp(p.leisureExp || 10);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load profiles', e);
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMsg('Please enter a profile name');
      return;
    }
    setErrorMsg('');

    const newProfile = {
      ...inputs,
      profileName: profileName.trim(),
      foodExp,
      transportExp,
      leisureExp,
      timestamp: new Date().toISOString()
    };

    const updatedProfiles = {
      ...profiles,
      [profileName.trim()]: newProfile
    };

    setProfiles(updatedProfiles);
    localStorage.setItem('sg_housing_profiles', JSON.stringify(updatedProfiles));
    localStorage.setItem('sg_housing_active_profile_key', profileName.trim());
    setSelectedProfileKey(profileName.trim());
    setProfileName('');
    alert(`Profile "${newProfile.profileName}" saved successfully!`);
  };

  const handleLoadProfile = (key) => {
    if (!key || !profiles[key]) return;
    setSelectedProfileKey(key);
    localStorage.setItem('sg_housing_active_profile_key', key);
    
    const p = profiles[key];
    // Load state
    onChange('all', p);
    
    // Load itemized expenses
    setFoodExp(p.foodExp || 15);
    setTransportExp(p.transportExp || 5);
    setLeisureExp(p.leisureExp || 10);
  };

  const handleDeleteProfile = (key, e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete profile "${key}"?`)) {
      const updated = { ...profiles };
      delete updated[key];
      setProfiles(updated);
      localStorage.setItem('sg_housing_profiles', JSON.stringify(updated));
      if (selectedProfileKey === key) {
        setSelectedProfileKey('');
        localStorage.removeItem('sg_housing_active_profile_key');
      }
    }
  };

  const toggleRegion = (region) => {
    let current = [...inputs.regions];
    if (current.includes('Any')) {
      current = [region];
    } else if (region === 'Any') {
      current = ['Any'];
    } else {
      if (current.includes(region)) {
        current = current.filter(r => r !== region);
        if (current.length === 0) current = ['Any'];
      } else {
        current.push(region);
      }
    }
    onChange('regions', current);
  };

  const toggleHousingType = (type) => {
    let current = [...inputs.housingTypes];
    if (current.includes('Any')) {
      current = [type];
    } else if (type === 'Any') {
      current = ['Any'];
    } else {
      if (current.includes(type)) {
        current = current.filter(t => t !== type);
        if (current.length === 0) current = ['Any'];
      } else {
        current.push(type);
      }
    }
    onChange('housingTypes', current);
  };

  const toggleAmenity = (amenity) => {
    let current = [...inputs.amenities];
    if (current.includes(amenity)) {
      current = current.filter(a => a !== amenity);
    } else {
      current.push(amenity);
    }
    onChange('amenities', current);
  };

  return (
    <div className="calculator-container glass-card">
      <div className="calculator-header">
        <div className="title-area">
          <Sparkles className="icon-mint animate-pulse" size={20} />
          <h2>Smart Budget Planner</h2>
        </div>
        <button 
          type="button"
          onClick={onToggleCollapse} 
          className="toggle-collapse-btn mobile-only"
          title={isCollapsed ? "Expand Calculator" : "Collapse Calculator"}
        >
          {isCollapsed ? "Edit Inputs" : "View Dashboard"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="calculator-body animate-fade-in">
          {/* Profile Manager Section */}
          <div className="profile-manager">
            <div className="profile-select-row">
              <FolderOpen size={16} className="text-muted" />
              <select 
                value={selectedProfileKey}
                onChange={(e) => handleLoadProfile(e.target.value)}
                className="profile-select"
              >
                <option value="">-- Load Saved Profile --</option>
                {Object.keys(profiles).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              {selectedProfileKey && (
                <button 
                  onClick={(e) => handleDeleteProfile(selectedProfileKey, e)}
                  className="delete-profile-btn"
                  title="Delete current profile"
                >
                  <Trash size={14} />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="profile-save-row">
              <input 
                type="text" 
                placeholder="Save current inputs as..." 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="profile-input"
              />
              <button type="submit" className="save-profile-btn">
                <Save size={14} />
                <span>Save</span>
              </button>
            </form>
            {errorMsg && <p className="error-text"><AlertCircle size={12} /> {errorMsg}</p>}
          </div>

          {/* Step Indicators */}
          <div className="step-indicator">
            <button type="button" onClick={() => setStep(1)} className={`step-dot ${step === 1 ? 'active' : ''}`}>1. Financials</button>
            <button type="button" onClick={() => setStep(2)} className={`step-dot ${step === 2 ? 'active' : ''}`}>2. Preferences</button>
            <button type="button" onClick={() => setStep(3)} className={`step-dot ${step === 3 ? 'active' : ''}`}>3. Lifestyle</button>
          </div>

          {/* STEP 1: FINANCIALS */}
          {step === 1 && (
            <div className="step-content animate-slide-in">
              <h3><DollarSign size={18} /> Monthly Financials</h3>
              
              <div className="input-group">
                <label>Monthly Gross Salary (S$)</label>
                <div className="input-wrapper">
                  <span className="prefix">$</span>
                  <input 
                    type="number" 
                    min="1500" 
                    max="15000" 
                    value={inputs.salary}
                    onChange={(e) => onChange('salary', parseInt(e.target.value) || 0)}
                  />
                </div>
                <span className="input-tip">Starting salary for grads typically ranges S$3,500 - S$5,000.</span>
              </div>

              <div className="input-group">
                <label>Target Monthly Savings (S$)</label>
                <div className="input-wrapper">
                  <span className="prefix">$</span>
                  <input 
                    type="number" 
                    min="0" 
                    max={inputs.salary - 500} 
                    value={inputs.savingsGoal}
                    onChange={(e) => onChange('savingsGoal', parseInt(e.target.value) || 0)}
                  />
                </div>
                <span className="input-tip">Aim for 20% of your gross salary (e.g. S$800 for S$4,000 salary).</span>
              </div>

              <hr className="divider" />

              <h4>Itemized Daily Expenses</h4>
              <div className="input-group">
                <label>Daily Food & Coffee (S$)</label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="1"
                  value={foodExp}
                  onChange={(e) => setFoodExp(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">S$ {foodExp} / day (S$ {Math.round(foodExp * 30.5)} / mo)</div>
              </div>

              <div className="input-group">
                <label>Daily Transit & Commute (S$)</label>
                <input 
                  type="range" 
                  min="2" 
                  max="30" 
                  step="1"
                  value={transportExp}
                  onChange={(e) => setTransportExp(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">S$ {transportExp} / day (S$ {Math.round(transportExp * 30.5)} / mo)</div>
              </div>

              <div className="input-group">
                <label>Daily Leisure & Misc (S$)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="60" 
                  step="1"
                  value={leisureExp}
                  onChange={(e) => setLeisureExp(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">S$ {leisureExp} / day (S$ {Math.round(leisureExp * 30.5)} / mo)</div>
              </div>

              <div className="total-daily-badge">
                <span>Total Daily Expenses:</span>
                <strong>S$ {inputs.dailyExpenses} / day (~S$ {Math.round(inputs.dailyExpenses * 30.5)}/mo)</strong>
              </div>

              <button type="button" onClick={() => setStep(2)} className="nav-btn next-btn">
                <span>Preferences</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 2: HOUSING PREFERENCES */}
          {step === 2 && (
            <div className="step-content animate-slide-in">
              <h3><MapPin size={18} /> Housing Preferences</h3>

              <div className="input-group">
                <label>Preferred Regions</label>
                <div className="pill-grid">
                  <button 
                    type="button"
                    className={`pill-btn ${inputs.regions.includes('Any') ? 'active' : ''}`}
                    onClick={() => toggleRegion('Any')}
                  >
                    Any region
                  </button>
                  {REGIONS.map(r => (
                    <button 
                      key={r}
                      type="button"
                      className={`pill-btn ${inputs.regions.includes(r) ? 'active' : ''}`}
                      onClick={() => toggleRegion(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Preferred Housing Types</label>
                <div className="pill-grid">
                  <button 
                    type="button"
                    className={`pill-btn ${inputs.housingTypes.includes('Any') ? 'active' : ''}`}
                    onClick={() => toggleHousingType('Any')}
                  >
                    Any type
                  </button>
                  {HOUSING_TYPES.map(t => (
                    <button 
                      key={t}
                      type="button"
                      className={`pill-btn ${inputs.housingTypes.includes(t) ? 'active' : ''}`}
                      onClick={() => toggleHousingType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span className="input-tip">HDB / Co-living rooms fit entry-level budgets. Whole flats require stretch budgets or flat-sharing.</span>
              </div>

              <div className="button-row">
                <button type="button" onClick={() => setStep(1)} className="nav-btn back-btn">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <button type="button" onClick={() => setStep(3)} className="nav-btn next-btn">
                  <span>Lifestyle</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LIFESTYLE & PROXIMITY */}
          {step === 3 && (
            <div className="step-content animate-slide-in">
              <h3><Heart size={18} /> Lifestyle & Proximity</h3>

              <div className="input-group">
                <label>MRT Proximity Importance</label>
                <div className="radio-group">
                  {['Very Important', 'Nice to Have', 'Not Important'].map(lvl => (
                    <label key={lvl} className={`radio-label ${inputs.mrtProximity === lvl ? 'checked' : ''}`}>
                      <input 
                        type="radio" 
                        name="mrtProximity" 
                        value={lvl} 
                        checked={inputs.mrtProximity === lvl} 
                        onChange={(e) => onChange('mrtProximity', e.target.value)} 
                      />
                      <span>{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Proximity to Workplace / Parents</label>
                <div className="radio-group">
                  {['Very Close', 'Flexible', 'Not Important'].map(dist => (
                    <label key={dist} className={`radio-label ${inputs.distancePreference === dist ? 'checked' : ''}`}>
                      <input 
                        type="radio" 
                        name="distancePreference" 
                        value={dist} 
                        checked={inputs.distancePreference === dist} 
                        onChange={(e) => onChange('distancePreference', e.target.value)} 
                      />
                      <span>{dist}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Desired Amenities</label>
                <div className="pill-grid">
                  {AMENITIES_POOL.map(a => (
                    <button 
                      key={a}
                      type="button"
                      className={`pill-btn size-sm ${inputs.amenities.includes(a) ? 'active' : ''}`}
                      onClick={() => toggleAmenity(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="button-row">
                <button type="button" onClick={() => setStep(2)} className="nav-btn back-btn">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <button 
                  type="button"
                  onClick={() => onToggleCollapse()} 
                  className="nav-btn next-btn btn-mint mobile-only"
                >
                  <span>Show Dashboard</span>
                  <Home size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isCollapsed && (
        <div className="calculator-collapsed animate-fade-in">
          <div className="collapsed-summary">
            <div className="summary-item">
              <span className="summary-label">Salary:</span>
              <span className="summary-val">S$ {inputs.salary}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Savings:</span>
              <span className="summary-val">S$ {inputs.savingsGoal}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Expenses:</span>
              <span className="summary-val">S$ {Math.round(inputs.dailyExpenses * 30.5)}</span>
            </div>
          </div>
          <button onClick={onToggleCollapse} className="btn-edit-inline">
            Modify Inputs
          </button>
        </div>
      )}
    </div>
  );
}
