import api from './api';

// Mock data for map service
const mockActiveTransports = [ // From GeospatialHub.js
  {
    transportId: "TR-2025-0123", organType: "Liver", status: "In Transit", priority: "High", eta: "1h 22m",
    route: "Apollo Chennai → Fortis Bangalore", from: { name: "Apollo Chennai", position: { top: '70%', left: '60%' } },
    to: { name: "Fortis Bangalore", position: { top: '30%', left: '30%' } },
    currentLocation: { lat: 12.9716, lng: 77.5946 }, coldChainTemp: "4.5°C",
  },
  {
    transportId: "TR-2025-0124", organType: "Kidney", status: "Delayed", priority: "Medium", eta: "2h 15m",
    route: "Manipal Delhi → AIIMS Delhi", from: { name: "Manipal Delhi", position: { top: '25%', left: '20%' } },
    to: { name: "AIIMS Delhi", position: { top: '45%', left: '50%' } },
    currentLocation: { lat: 28.6139, lng: 77.2090 }, coldChainTemp: "5.1°C (Alert)",
  },
];


export const getActiveTransports = async (filters = {}) => { // Add filters if backend supports
  try {
    // const response = await api.get('/logistics/transports/active', { params: filters }); 
    // return response.data; // Expecting an array of transport objects

    // Mock implementation:
    console.log("Simulating fetching active transports with filters:", filters);
    await new Promise(resolve => setTimeout(resolve, 500));
    let filteredTransports = mockActiveTransports;
    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredTransports = mockActiveTransports.filter(t => 
            t.transportId.toLowerCase().includes(term) ||
            t.organType.toLowerCase().includes(term) ||
            t.route.toLowerCase().includes(term)
        );
    }
    return filteredTransports;

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch active transports.';
    const newError = new Error(errorMessage);
    // @ts-ignore
    newError.response = error.response;
    throw newError;
  }
};

export const getTransportDetails = async (transportId) => {
    try {
        // const response = await api.get(`/logistics/transports/${transportId}`);
        // return response.data; // Expecting a single detailed transport object

        // Mock implementation:
        console.log("Simulating fetching details for transport:", transportId);
        await new Promise(resolve => setTimeout(resolve, 300));
        const transport = mockActiveTransports.find(t => t.transportId === transportId);
        if (transport) {
            return { // Add more details than the list view if available
                ...transport,
                vehicleId: "TN-01-AB-1234",
                driverName: "Ramesh K.",
                contact: "+919988776655",
                estimatedArrivalTimeFull: new Date(Date.now() + (parseFloat(transport.eta) * 60 * 60 * 1000)).toISOString(),
                fullRouteCoordinates: [ /* Array of [lng, lat] for Mapbox line */ ],
                alerts: transport.status === "Delayed" ? [{ type: "TrafficDelay", message: "Heavy traffic on NH44" }] : []
            };
        } else {
            const error = new Error('Transport not found');
            // @ts-ignore
            error.response = { data: { message: `Transport ID ${transportId} not found.` }, status: 404 };
            throw error;
        }

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch transport details.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};

// If you need to call Mapbox/OR-Tools APIs directly from frontend (not usually recommended for OR-Tools)
// This would typically be handled by your backend to keep API keys secure and manage complexity.
// export const getOptimizedRouteFromMapService = async (originCoords, destinationCoords, waypoints = []) => { 
//   try {
//      // Example: const response = await mapboxApi.getDirections(...)
//      // return response.data;
//   } catch (error) {
//      throw error;
//   }
// }