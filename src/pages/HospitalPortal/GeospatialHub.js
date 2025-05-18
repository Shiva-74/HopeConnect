import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from '../../components/Dashboard/MapComponent';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { getActiveTransports } from '../../services/mapService'; // Ensure this service exists and is correct
import './GeospatialHub.css'; 
import InputField from '../../components/Form/InputField'; // For search
import Button from '../../components/Common/Button'; // For search button

// Mock Data (already present in your MapService, but can be here for dev)
const mockActiveTransportsDataFallback = [
  {
    transportId: "TR-MOCK-001", organType: "Heart", status: "In Transit", priority: "Critical", eta: "0h 45m",
    route: "City Hospital A → Metro General B", from: { name: "City Hospital A", position: { top: '20%', left: '15%' } },
    to: { name: "Metro General B", position: { top: '75%', left: '80%' } },
    currentLocation: { lat: 28.60, lng: 77.22 }, coldChainTemp: "3.8°C",
  },
];

const GeospatialHub = () => {
  const [activeTransports, setActiveTransports] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchTransports = useCallback(async (currentSearchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getActiveTransports({ searchTerm: currentSearchTerm });
      setActiveTransports(data || []);
      if (data && data.length > 0 && !selectedTransport) {
        setSelectedTransport(data[0]); // Auto-select first transport if none selected
      } else if (data && data.length === 0) {
        setSelectedTransport(null); // Clear selection if no transports match
      }
    } catch (err) {
      console.error("Failed to fetch active transports:", err);
      setError("Failed to load transport data. " + (err.response?.data?.message || err.message));
      setActiveTransports([]);
      setSelectedTransport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTransport]); // Re-fetch if selectedTransport changes (e.g. to ensure it's still in the list)

  useEffect(() => {
    fetchTransports(searchTerm);
    // Setting up a poller for real-time updates
    const intervalId = setInterval(() => fetchTransports(searchTerm), 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchTransports, searchTerm]);


  const handleSelectTransport = (transport) => {
    // In a real app, you might fetch more detailed data for the selected transport here
    // For now, MapComponent will use the data from the list item
    setSelectedTransport(transport);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransports(searchTerm);
  };

  const getStatusClass = (status) => { // Duplicated here for list item styling
    const s = status?.toLowerCase().replace(/\s+/g, '-');
    if (s === 'in-transit') return 'status-in-transit';
    if (s === 'delayed') return 'status-delayed';
    if (s === 'arrived' || s === 'delivered') return 'status-arrived';
    if (s === 'pending' || s === 'scheduled') return 'status-pending';
    return 'status-default';
  };


  return (
    <div className="geospatial-hub-page">
      <div className="page-header-controls">
        <div>
            <h3>Cross-Border Geospatial Hub</h3>
            <p className='mb-0 page-subtitle-text'>Real-time logistics tracking and optimization for organ transport.</p>
        </div>
        <form onSubmit={handleSearchSubmit} className="search-filter-geospatial">
            <InputField
                type="text"
                id="transportSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, Organ, Route..."
                className="form-control-sm" // Ensure InputField can take this
            />
            {/* Removed Search Button, search happens on type or can be re-added */}
             {/* <Button type="submit" className="btn-primary btn-sm" disabled={loading}>Search</Button> */}
        </form>
      </div>

      {error && <p className="error-message card">{error}</p>}

      <div className="hub-layout-geospatial">
        <div className="transport-list-sidebar-geospatial">
          <h4>Active Transports ({activeTransports.length}) {loading && <LoadingSpinner size="20px" thickness="2px" className="inline-loader"/>}</h4>
          {activeTransports.length === 0 && !loading && !error && <p className="no-transports-message">No active transports match your criteria.</p>}
          <ul>
            {activeTransports.map(transport => (
              <li 
                key={transport.transportId} 
                className={`transport-list-item ${selectedTransport?.transportId === transport.transportId ? 'active' : ''}`}
                onClick={() => handleSelectTransport(transport)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectTransport(transport)}
                aria-current={selectedTransport?.transportId === transport.transportId ? "page" : undefined}
              >
                <div className="item-main-info">
                    <strong>{transport.transportId}</strong> ({transport.organType})
                </div>
                <div className="item-sub-info">
                    <span className={`status-indicator-inline ${getStatusClass(transport.status)}`}>{transport.status}</span>
                    <span className="priority-indicator">{transport.priority} Priority</span>
                </div>
                <small className="route-preview">{transport.route}</small>
                <small className="eta-preview">ETA: {transport.eta}</small>
              </li>
            ))}
          </ul>
        </div>
        <div className="map-display-area-geospatial">
          {loading && !selectedTransport && activeTransports.length === 0 ? (
             <div className="no-transport-selected card"><LoadingSpinner size="50px"/></div>
          ) : selectedTransport ? (
            <MapComponent transportInfo={selectedTransport} />
          ) : activeTransports.length > 0 ? ( // Some transports available but none selected
             <div className="no-transport-selected card">
                <p>Select an active transport from the list to view its details on the map.</p>
            </div>
          ) : !error && !loading && activeTransports.length === 0 ? ( // No transports, not loading, no error
            <div className="no-transport-selected card">
                <p>No active transports to display on the map at the moment.</p>
            </div>
          ) : null
          }
        </div>
      </div>
    </div>
  );
};

export default GeospatialHub;