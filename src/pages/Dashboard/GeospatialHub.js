import React, { useState, useEffect, useCallback } from 'react';
// import PageTitle from '../../components/Common/PageTitle'; // Title usually comes from parent layout
import MapComponent from '../../components/Dashboard/MapComponent';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
// import { getActiveTransports, getTransportDetails } from '../../services/mapService'; // Example service functions
import './GeospatialHub.css'; // Make sure this CSS file exists

// Mock Data for Geospatial Hub
const mockActiveTransportsData = [
  {
    transportId: "TR-2025-0123",
    organType: "Liver",
    status: "In Transit",
    priority: "High",
    eta: "1h 22m",
    distance: "115 km",
    route: "Apollo Hospital Chennai → Fortis Hospital Bangalore",
    from: { name: "Apollo Chennai", position: { top: '70%', left: '60%' }, address: "Greams Road, Chennai" },
    to: { name: "Fortis Bangalore", position: { top: '30%', left: '30%' }, address: "Bannerghatta Road, Bangalore" },
    currentLocation: { lat: 12.9716, lng: 77.5946 }, // Example
    vehicleId: "TN-01-AB-1234",
    driverName: "Ramesh K.",
    coldChainTemp: "4.5°C",
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
  },
  {
    transportId: "TR-2025-0124",
    organType: "Kidney",
    status: "Delayed",
    priority: "Medium",
    eta: "2h 15m (was 1h 45m)",
    distance: "85 km",
    route: "Manipal Hospital Delhi → AIIMS Delhi",
    from: { name: "Manipal Delhi", position: { top: '25%', left: '20%' }, address: "Dwarka, New Delhi" },
    to: { name: "AIIMS Delhi", position: { top: '45%', left: '50%' }, address: "Ansari Nagar, New Delhi" },
    currentLocation: { lat: 28.6139, lng: 77.2090 },
    vehicleId: "DL-02-CD-5678",
    driverName: "Suresh P.",
    coldChainTemp: "5.1°C (Alert: Slightly High)",
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
  },
   {
    transportId: "TR-2025-0125",
    organType: "Heart",
    status: "Arrived",
    priority: "Critical",
    eta: "0h 0m",
    distance: "0 km",
    route: "PGIMER Chandigarh → Recipient Hospital",
    from: { name: "PGIMER Chandigarh", position: { top: '10%', left: '10%' }, address: "Sector 12, Chandigarh" },
    to: { name: "Recipient Hospital X", position: { top: '15%', left: '30%' }, address: "Sector 11, Chandigarh" },
    currentLocation: null, // Arrived
    vehicleId: "CH-03-EF-9012",
    driverName: "Amit V.",
    coldChainTemp: "4.0°C",
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago (arrival time)
  }
];


const GeospatialHub = () => {
  const [activeTransports, setActiveTransports] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTransports = useCallback(async () => {
    setLoading(true);
    try {
      // const data = await getActiveTransports();
      // For mock:
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const filteredData = mockActiveTransportsData.filter(transport => 
        transport.transportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transport.organType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transport.route.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setActiveTransports(filteredData);
      if (filteredData.length > 0 && !selectedTransport) { // Select first if none selected or current selected is filtered out
        setSelectedTransport(filteredData[0]);
      } else if (filteredData.length === 0) {
        setSelectedTransport(null);
      }
    } catch (error) {
      console.error("Failed to fetch active transports:", error);
      setActiveTransports([]); // Clear transports on error
      setSelectedTransport(null);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedTransport]); // Added selectedTransport to dependencies

  useEffect(() => {
    fetchTransports();
    // Optional: Set up polling for real-time updates
    // const intervalId = setInterval(fetchTransports, 30000); // Fetch every 30 seconds
    // return () => clearInterval(intervalId);
  }, [fetchTransports]);


  const handleSelectTransport = (transport) => {
    // If fetching full details on select:
    // setLoading(true);
    // getTransportDetails(transport.transportId).then(details => {
    //   setSelectedTransport(details);
    //   setLoading(false);
    // }).catch(err => setLoading(false));
    setSelectedTransport(transport);
  };

  if (loading && activeTransports.length === 0) { // Show main loader only on initial full load
    return <div className="container text-center mt-3"><LoadingSpinner size="60px"/></div>;
  }

  return (
    <div className="geospatial-hub-page">
      <div className="page-header-controls">
        <div>
            <h3>Cross-Border Geospatial Hub</h3>
            <p className='mb-0 page-subtitle-text'>Real-time logistics tracking and optimization for organ transport.</p>
        </div>
        <div className="search-filter-geospatial">
            <input 
                type="text" 
                placeholder="Search transports (ID, Organ, Route)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control-sm" // Needs styling
            />
        </div>
      </div>

      <div className="hub-layout-geospatial">
        <div className="transport-list-sidebar-geospatial">
          <h4>Active Transports ({activeTransports.length}) {loading && activeTransports.length > 0 && <LoadingSpinner size="20px" thickness="2px" className="inline-loader"/>}</h4>
          {activeTransports.length === 0 && !loading && <p className="no-transports-message">No active transports match your criteria.</p>}
          <ul>
            {activeTransports.map(transport => (
              <li 
                key={transport.transportId} 
                className={`transport-list-item ${selectedTransport?.transportId === transport.transportId ? 'active' : ''}`}
                onClick={() => handleSelectTransport(transport)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectTransport(transport)}
              >
                <div className="item-main-info">
                    <strong>{transport.transportId}</strong> ({transport.organType})
                </div>
                <div className="item-sub-info">
                    <span className={`status-indicator-inline status-${transport.status.toLowerCase().replace(/\s+/g, '-')}`}>{transport.status}</span>
                    <span className="priority-indicator">{transport.priority} Priority</span>
                </div>
                <small className="route-preview">{transport.route.split('→')[0]} → ...</small>
              </li>
            ))}
          </ul>
        </div>
        <div className="map-display-area-geospatial">
          {selectedTransport ? (
            <MapComponent transportInfo={selectedTransport} />
          ) : !loading && activeTransports.length > 0 ? (
             <div className="no-transport-selected card">
                <p>Select an active transport from the list to view its details on the map.</p>
            </div>
          ) : !loading && activeTransports.length === 0 ? (
            <div className="no-transport-selected card">
                <p>No transports available to display on the map.</p>
            </div>
          ) : null /* While initial full loading, this area can be blank or show a map loading state */
          }
        </div>
      </div>
    </div>
  );
};

export default GeospatialHub;