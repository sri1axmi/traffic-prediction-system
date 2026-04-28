import React, { useState, useEffect, useCallback } from 'react';
import Auth from './components/Auth';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import { useTrafficStream } from './hooks/useTrafficStream';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('traffic_auth') === 'true'
  );

  const handleLogin = () => {
    localStorage.setItem('traffic_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('traffic_auth');
    setIsAuthenticated(false);
  };
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [destination, setDestination] = useState(null); // { lat, lng, name }
  const [predictionData, setPredictionData] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, connected, error
  const [predicting, setPredicting] = useState(false);

  // Check backend health
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${BACKEND_URL}/`)
      .then(res => res.ok ? setBackendStatus('connected') : setBackendStatus('error'))
      .catch(() => setBackendStatus('error'));
  }, [isAuthenticated]);

  // Request geolocation
  useEffect(() => {
    if (isAuthenticated && !userLocation) {
      requestLocation();
    }
  }, [isAuthenticated]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
      },
      () => {
        setLocationError('Location denied — using default');
        setUserLocation({ lat: 17.385, lng: 78.4867 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handlePredict = useCallback(async () => {
    if (!destination || !userLocation) return;
    setPredicting(true);
    setBackendStatus('predicting');

    try {
      const res = await fetch(`${BACKEND_URL}/api/predict/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: 'auto',
          area: destination.name || 'destination',
          road: `${userLocation.lat},${userLocation.lng}->${destination.lat},${destination.lng}`,
          time: new Date().toTimeString().slice(0, 5),
        }),
      });

      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();

      setPredictionData(data);
      setBackendStatus('connected');

      // Build mock routes based on real coordinates
      const midLat = (userLocation.lat + destination.lat) / 2;
      const midLng = (userLocation.lng + destination.lng) / 2;
      const offset = 0.005;

      setRoutes([
        {
          id: 1, name: 'AI-Optimal Route', congestion: data.overallCongestion === 'Low' ? 'Low' : 'Medium',
          smartScore: 96.2, eta: `${12 + data.delay} mins`, distance: '—',
          path: [
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: midLat + offset, lng: midLng - offset },
            { lat: destination.lat, lng: destination.lng },
          ],
        },
        {
          id: 2, name: 'Fastest Route', congestion: data.overallCongestion,
          smartScore: 88.7, eta: `${10 + data.delay} mins`, distance: '—',
          path: [
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: midLat - offset, lng: midLng + offset },
            { lat: destination.lat, lng: destination.lng },
          ],
        },
        {
          id: 3, name: 'Alternate Route', congestion: 'Low',
          smartScore: 79.3, eta: `${18 + data.delay} mins`, distance: '—',
          path: [
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: midLat, lng: midLng + offset * 2 },
            { lat: destination.lat, lng: destination.lng },
          ],
        },
      ]);
      setSelectedRouteIdx(0);
    } catch (err) {
      console.error(err);
      setBackendStatus('error');

      // Fallback: show mock data even if backend is down
      setPredictionData({
        overallCongestion: 'Medium',
        delay: 5,
        confidence: 0.82,
        predictionWindow: '20 minutes',
        segments: [],
        features: [
          { name: 'Time of Day', impact: 42 },
          { name: 'Historical Pattern', impact: 28 },
          { name: 'Weather Conditions', impact: 18 },
          { name: 'Road Incidents', impact: 12 },
        ],
        ensembleModels: ['xgboost', 'lightgbm', 'catboost'],
        modelBreakdown: [
          { model: 'xgboost',  score: 0.52, weight: 0.40 },
          { model: 'lightgbm', score: 0.48, weight: 0.35 },
          { model: 'catboost', score: 0.55, weight: 0.25 },
        ],
      });

      const midLat = (userLocation.lat + destination.lat) / 2;
      const midLng = (userLocation.lng + destination.lng) / 2;
      setRoutes([
        {
          id: 1, name: 'AI-Optimal Route', congestion: 'Low',
          smartScore: 96.2, eta: '15 mins', distance: '—',
          path: [
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: midLat + 0.005, lng: midLng - 0.005 },
            { lat: destination.lat, lng: destination.lng },
          ],
        },
        {
          id: 2, name: 'Fastest Route', congestion: 'Medium',
          smartScore: 88.7, eta: '12 mins', distance: '—',
          path: [
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: midLat - 0.005, lng: midLng + 0.005 },
            { lat: destination.lat, lng: destination.lng },
          ],
        },
      ]);
      setSelectedRouteIdx(0);
    } finally {
      setPredicting(false);
    }
  }, [destination, userLocation]);

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  const { liveTrafficData, isConnected } = useTrafficStream();

  return (
    <div className="app-container relative">
      {/* Live Traffic Banner overlay */}
      {isConnected && liveTrafficData.length > 0 && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-blue-900 bg-opacity-90 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center space-x-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span>Live Stream Active: {liveTrafficData.length} roads updating</span>
        </div>
      )}
      <Sidebar
        userLocation={userLocation}
        locationError={locationError}
        destination={destination}
        setDestination={setDestination}
        predictionData={predictionData}
        routes={routes}
        selectedRouteIdx={selectedRouteIdx}
        setSelectedRouteIdx={setSelectedRouteIdx}
        backendStatus={backendStatus}
        predicting={predicting}
        onPredict={handlePredict}
      />
      <div className="map-container">
        <MapView
          userLocation={userLocation}
          destination={destination}
          routes={routes}
          selectedRouteIdx={selectedRouteIdx}
          predictionData={predictionData}
          onLocate={requestLocation}
        />
      </div>
    </div>
  );
}

export default App;
