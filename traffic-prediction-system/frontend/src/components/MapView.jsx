import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Blue dot for user location
const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#1a73e8;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 2px rgba(26,115,232,0.3), 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Red dot for destination
const destIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#d93025;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 2px rgba(217,48,37,0.3), 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitBounds({ userLocation, destination }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation && destination) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, destination, map]);
  return null;
}

const congestionColors = { Low: '#1e8e3e', Medium: '#f9ab00', High: '#d93025' };

export default function MapView({ userLocation, destination, routes, selectedRouteIdx, predictionData, onLocate }) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [17.385, 78.4867];

  return (
    <>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <FitBounds userLocation={userLocation} destination={destination} />

        {/* Google Maps-style light tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* User location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup><strong>📍 Your Location</strong></Popup>
          </Marker>
        )}

        {/* Destination */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup><strong>📌 {destination.name || 'Destination'}</strong></Popup>
          </Marker>
        )}

        {/* Draw all routes */}
        {routes.map((route, idx) => (
          <Polyline
            key={route.id}
            positions={route.path.map(p => [p.lat, p.lng])}
            color={idx === selectedRouteIdx
              ? (congestionColors[route.congestion] || '#1a73e8')
              : '#9aa0a6'}
            weight={idx === selectedRouteIdx ? 6 : 4}
            opacity={idx === selectedRouteIdx ? 0.9 : 0.4}
          />
        ))}

        {/* Congestion markers */}
        {predictionData && predictionData.segments && predictionData.segments.map((seg, idx) => (
          <CircleMarker
            key={idx}
            center={seg.location}
            radius={10}
            pathOptions={{
              color: congestionColors[seg.congestionLevel] || '#1a73e8',
              fillColor: congestionColors[seg.congestionLevel] || '#1a73e8',
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{seg.congestionLevel} Traffic</strong><br />
              Predicted in 20 min
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Locate button */}
      <button className="map-locate-btn" onClick={onLocate} title="My location">◎</button>
    </>
  );
}
