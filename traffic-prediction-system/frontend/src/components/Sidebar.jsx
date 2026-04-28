import React, { useState, useRef, useEffect, useCallback } from 'react';
import ExplainabilityPanel from './ExplainabilityPanel';

/**
 * Free autocomplete using OpenStreetMap Nominatim.
 * No API key required.
 */
function useNominatimSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setResults(
          data.map((item) => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return { results, loading };
}

export default function Sidebar({
  userLocation,
  locationError,
  destination,
  setDestination,
  predictionData,
  routes,
  selectedRouteIdx,
  setSelectedRouteIdx,
  backendStatus,
  predicting,
  onPredict,
}) {
  const [destInput, setDestInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { results: suggestions, loading: searchLoading } = useNominatimSearch(destInput);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectPlace = useCallback((place) => {
    setDestination(place);
    setDestInput(place.name.split(',').slice(0, 2).join(','));
    setShowSuggestions(false);
  }, [setDestination]);

  const statusLabel = {
    checking: { icon: '🟡', text: 'Checking backend...' },
    connected: { icon: '🟢', text: 'Backend Connected' },
    predicting: { icon: '🟡', text: 'Predicting...' },
    error: { icon: '🔴', text: 'Backend Offline (mock mode)' },
  };
  const status = statusLabel[backendStatus] || statusLabel.error;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">T</div>
        <div className="sidebar-title">TrafficAI</div>
      </div>

      <div className="sidebar-content">
        {/* System Status */}
        <div className="status-bar">
          <span>{status.icon}</span>
          <span>{status.text}</span>
        </div>

        {/* Location Banner */}
        {locationError ? (
          <div className="location-banner error">⚠ {locationError}</div>
        ) : userLocation ? (
          <div className="location-banner">📍 Location detected</div>
        ) : (
          <div className="location-banner">⏳ Getting your location...</div>
        )}

        {/* Search Box */}
        <div className="search-box">
          <div className="search-row">
            <div className="search-dot origin" />
            <input
              className="search-input"
              placeholder="Your location"
              value={userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : ''}
              readOnly
            />
          </div>
          <div className="search-divider" />
          <div className="search-row" ref={wrapperRef} style={{ position: 'relative' }}>
            <div className="search-dot destination" />
            <input
              className="search-input"
              placeholder="Search a destination..."
              value={destInput}
              onChange={(e) => {
                setDestInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && (destInput.length >= 3) && (
              <div className="autocomplete-dropdown">
                {searchLoading && (
                  <div className="autocomplete-item loading">Searching...</div>
                )}
                {!searchLoading && suggestions.length === 0 && destInput.length >= 3 && (
                  <div className="autocomplete-item loading">No results found</div>
                )}
                {suggestions.map((place, idx) => (
                  <div
                    key={idx}
                    className="autocomplete-item"
                    onClick={() => selectPlace(place)}
                  >
                    <span className="autocomplete-icon">📍</span>
                    <span className="autocomplete-text">
                      {place.name.length > 60 ? place.name.slice(0, 60) + '...' : place.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Predict Button */}
        <button
          className="btn-primary"
          onClick={onPredict}
          disabled={predicting || !destination}
        >
          {predicting ? '🔄 Predicting traffic in 20 min...' : '🔮 Predict & Find Best Route'}
        </button>

        {/* Traffic Comparison */}
        {predictionData && (
          <div className="traffic-comparison fade-in">
            <div className="comparison-row">
              <div className="comparison-item">
                <span className="comparison-label">🟢 Current Traffic</span>
                <span className="comparison-value">Live</span>
              </div>
              <div className="comparison-divider" />
              <div className="comparison-item">
                <span className="comparison-label">🔮 AI Predicted (20 min)</span>
                <span className={`comparison-value badge-text-${predictionData.overallCongestion.toLowerCase()}`}>
                  {predictionData.overallCongestion}
                </span>
              </div>
            </div>
            <div className="prediction-delay">
              ⏱ Predicted delay: +{predictionData.delay} mins
            </div>
          </div>
        )}

        {/* Route Results */}
        {routes.length > 0 && (
          <div className="routes-section fade-in">
            <div className="routes-title">Routes — AI Ranked</div>
            {routes.map((route, idx) => (
              <div
                key={route.id}
                className={`route-card ${idx === selectedRouteIdx ? 'active' : ''}`}
                onClick={() => setSelectedRouteIdx(idx)}
              >
                <div className={`route-icon ${idx === 0 ? 'best' : 'alt'}`}>
                  {idx === 0 ? '★' : '→'}
                </div>
                <div className="route-info">
                  <div className="route-name">{route.name}</div>
                  <div className="route-meta">
                    {route.eta} • Score: {route.smartScore}
                  </div>
                </div>
                <span className={`route-badge badge-${route.congestion.toLowerCase()}`}>
                  {route.congestion}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Prediction confidence */}
        {predictionData && (
          <div className="prediction-card fade-in">
            <div className="prediction-header">
              <div className="prediction-title">🔮 {predictionData.predictionWindow} Ahead</div>
              <div className="prediction-confidence">
                {(predictionData.confidence * 100).toFixed(0)}% confident
              </div>
            </div>
          </div>
        )}

        {/* Explainability */}
        {predictionData && (
          <ExplainabilityPanel
            features={predictionData.features}
            confidence={predictionData.confidence}
            modelBreakdown={predictionData.modelBreakdown}
            ensembleModels={predictionData.ensembleModels}
          />
        )}
      </div>
    </div>
  );
}
