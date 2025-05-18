import React, { useEffect, useRef } from 'react';
import './MapComponent.css'; // Make sure this CSS file exists

// IMPORTANT: This is still a VISUAL PLACEHOLDER.
// For actual Mapbox integration, you would:
// 1. Install mapbox-gl: `npm install mapbox-gl` or `yarn add mapbox-gl`
// 2. Import mapboxgl: `import mapboxgl from '!mapbox-gl';` // eslint-disable-line import/no-webpack-loader-syntax
// 3. Set your Mapbox access token: `mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';` (store in .env)
// 4. Initialize the map in a useEffect hook, manage markers, routes, etc.

const MapComponent = ({ transportInfo }) => {
  const mapContainerRef = useRef(null); // For actual Mapbox map

  const {
    transportId = "TR-XXXX-XXXX",
    organType = "N/A",
    status = "Unknown",
    eta = "N/A",
    distance = "N/A",
    route = "N/A → N/A",
    from = { name: "Origin", position: { top: '30%', left: '20%' } },
    to = { name: "Destination", position: { top: '60%', left: '70%' } },
    // currentLocation (lat, lng) would be used for real map marker
  } = transportInfo || {};

  const getStatusColor = () => {
    const s = status?.toLowerCase();
    if (s === 'arrived' || s === 'delivered') return '#28a745'; // Green
    if (s === 'in transit') return '#007bff'; // Blue
    if (s === 'delayed') return '#dc3545'; // Red
    if (s === 'pending' || s === 'scheduled') return '#ffc107'; // Yellow
    return '#6c757d'; // Gray
  };

  // Placeholder for Mapbox initialization (would run once)
  useEffect(() => {
    // if (mapContainerRef.current && !mapContainerRef.current.map) { // Check if map is already initialized
    //   // Initialize Mapbox map here
    //   // const map = new mapboxgl.Map({
    //   //   container: mapContainerRef.current,
    //   //   style: 'mapbox://styles/mapbox/streets-v11', // or your custom style
    //   //   center: [lng, lat], // Default center
    //   //   zoom: 9
    //   // });
    //   // mapContainerRef.current.map = map; // Store map instance
    //   // Add markers, routes based on transportInfo
    // }
    // // Cleanup map on component unmount
    // // return () => mapContainerRef.current.map?.remove();
  }, []);

  // Update map when transportInfo changes (markers, route)
  useEffect(() => {
    // if (mapContainerRef.current.map && transportInfo) {
    //   // Update markers, draw route (e.g., using Mapbox Directions API or OR-Tools output)
    // }
  }, [transportInfo]);

  return (
    <div className="geospatial-hub-map-view">
      <div className="map-area-wrapper">
        {/* <div ref={mapContainerRef} className="mapbox-map-container" /> */}
        {/* Visual Placeholder (shown if Mapbox isn't integrated) */}
        <div className="map-visual-placeholder">
          <p className="map-placeholder-text">
            Interactive Map Area <br/> (Mapbox/OR-Tools Integration Placeholder)
          </p>
          <div className="map-point hospital-a" style={{ top: from.position.top, left: from.position.left, visibility: transportInfo ? 'visible' : 'hidden' }}>
            <span>{from.name}</span>
          </div>
          <div className="map-point hospital-b" style={{ top: to.position.top, left: to.position.left, visibility: transportInfo ? 'visible' : 'hidden' }}>
            <span>{to.name}</span>
          </div>
          {transportInfo && (
            <svg className="route-line-svg" width="100%" height="100%">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={getStatusColor()} />
                    </marker>
                </defs>
                <path 
                d={`M ${parseFloat(from.position.left) + 1.5}% ${parseFloat(from.position.top) + 1.5}% Q ${parseFloat(from.position.left) + 20}% ${parseFloat(from.position.top) - 10}%, ${parseFloat(to.position.left) + 1.5}% ${parseFloat(to.position.top) + 1.5}%`}
                stroke={getStatusColor()}
                strokeWidth="3" 
                fill="none" 
                strokeDasharray={status?.toLowerCase() === 'in transit' ? "8,8" : "none"}
                markerEnd="url(#arrowhead)"
                />
            </svg>
          )}
        </div>
      </div>

      {transportInfo && (
        <div className="transport-info-panel card">
          <h4>Transport Details</h4>
          <div className="info-grid">
            <div className="info-item"><strong>ID:</strong> <span>{transportId}</span></div>
            <div className="info-item"><strong>Organ:</strong> <span>{organType}</span></div>
            <div className="info-item"><strong>Status:</strong> <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>{status}</span></div>
            <div className="info-item"><strong>ETA:</strong> <span>{eta}</span></div>
            <div className="info-item"><strong>Distance:</strong> <span>{distance}</span></div>
          </div>
          <div className="info-item route-info"><strong>Route:</strong> <span>{route}</span></div>
          {/* Add more details like current speed, temperature, etc. if available */}
        </div>
      )}
    </div>
  );
};

export default MapComponent;